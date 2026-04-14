import { Injectable } from '@angular/core';
import { PersonalizedRecommendations, RecommendationBatch, ScoredRecommendation, UserProfile } from '../../models/recommendations';
import { MediaType, TmdbMediaItem } from '../../models/tmdb';
import { WatchedItem } from '../../models/watch-history';
import { Tmdb } from './tmdb';
import { WatchHistory } from './watch-history';

@Injectable({
  providedIn: 'root'
})
export class Recommendations {
  private readonly recommendationCache = new Map<string, { expiresAt: number; value: PersonalizedRecommendations }>();

  constructor(
    private tmdb: Tmdb,
    private watchHistory: WatchHistory
  ) {}

  async getHomeRecommendations(limit = 12): Promise<PersonalizedRecommendations> {
    const history = this.watchHistory.getRecent(20);
    if (!history.length) {
      return {
        items: [],
        reason: 'Watch a few titles and we will personalize this row for you.'
      };
    }

    const cacheKey = this.buildCacheKey(history, limit);
    const cached = this.recommendationCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const profile = this.buildProfile(history);
    const batches = await this.loadBatches(profile);
    const watchedKeys = new Set(history.map(entry => this.itemKey(entry.id, entry.media_type)));

    const scored = this.scoreCandidates(batches, profile, watchedKeys);
    const items = this.pickDiverseResults(scored, limit);
    const reason = this.buildReason(profile);

    const response: PersonalizedRecommendations = { items, reason };
    this.recommendationCache.set(cacheKey, {
      value: response,
      expiresAt: Date.now() + 1000 * 60 * 5
    });

    return response;
  }

  async getWatchRecommendations(currentType: MediaType, currentId: number, limit = 10): Promise<PersonalizedRecommendations> {
    const history = this.watchHistory.getRecent(30);
    const current = history.find(item => item.id === currentId && item.media_type === currentType);

    if (!current) {
      return {
        items: [],
        reason: 'Strict mode is on. Watch this title first to build same-country, same-genre recommendations.'
      };
    }

    const targetGenres = current.genres.slice(0, 3);
    const targetCountry = current.origin_countries?.[0];
    const targetLanguage = current.original_language;
    const keywordIds = (await this.tmdb.getKeywords(currentType, currentId)).map(keyword => keyword.id).filter(Boolean).slice(0, 2);

    const tasks: Array<Promise<RecommendationBatch>> = [];

    // Build strict candidate pools around the currently watched title.
    targetGenres.forEach((genreId, index) => {
      tasks.push(
        this.tmdb.getDiscover(currentType, {
          genreId,
          originCountry: targetCountry,
          originalLanguage: targetLanguage,
          minRating: 6,
          page: 1
        }).then(response => ({
          items: response?.results || [],
          sourceWeight: 4 - index * 0.4,
          sourceType: 'genre' as const,
          originCountry: targetCountry,
          genreId
        }))
      );

      keywordIds.forEach((keywordId, keywordIndex) => {
        tasks.push(
          this.tmdb.getDiscover(currentType, {
            genreId,
            originCountry: targetCountry,
            originalLanguage: targetLanguage,
            keywordId,
            minRating: 6,
            page: 1
          }).then(response => ({
            items: response?.results || [],
            sourceWeight: 4.6 - (index * 0.35 + keywordIndex * 0.2),
            sourceType: 'keyword' as const,
            originCountry: targetCountry,
            genreId,
            keywordId
          }))
        );
      });
    });

    if (targetCountry) {
      tasks.push(
        this.tmdb.getDiscover(currentType, {
          originCountry: targetCountry,
          originalLanguage: targetLanguage,
          minRating: 6,
          page: 1
        }).then(response => ({
          items: response?.results || [],
          sourceWeight: 3,
          sourceType: 'country' as const,
          originCountry: targetCountry
        }))
      );
    }

    tasks.push(
      this.tmdb.getRecommendations(currentType, currentId).then(response => ({
        items: response?.results || [],
        sourceWeight: 1.8,
        sourceType: 'seed' as const
      }))
    );

    const batches = await Promise.all(tasks);
    const watchedKeys = new Set(history.map(item => this.itemKey(item.id, item.media_type)));
    const scored = new Map<string, ScoredRecommendation>();

    // Score each candidate and keep the highest-scoring entry per id/type pair.
    for (const batch of batches) {
      for (const rawItem of batch.items) {
        const id = Number(rawItem?.id);
        if (!Number.isFinite(id) || id <= 0) continue;

        const mediaType = this.resolveMediaType(rawItem, currentType);
        if (mediaType !== currentType) continue;

        const key = this.itemKey(id, mediaType);
        if (watchedKeys.has(key)) continue;

        const itemGenres = rawItem?.genre_ids || [];
        const genreOverlap = this.countGenreOverlap(itemGenres, targetGenres);
        const languageMatch = targetLanguage && rawItem?.original_language === targetLanguage;

        // For watch mode, enforce same-genre signal as a minimum requirement.
        if (targetGenres.length && genreOverlap === 0) continue;

        // Strict mode: when we know the current origin country, keep only candidates sourced from that country.
        if (targetCountry && batch.originCountry && batch.originCountry !== targetCountry) continue;
        if (targetCountry && !batch.originCountry && batch.sourceType !== 'seed') continue;

        const qualityScore = this.normalizeRange(Number(rawItem?.vote_average) || 0, 0, 10, 0, 1.2);
        const popularityScore = this.normalizeRange(Math.log10((Number(rawItem?.popularity) || 0) + 1), 0, 2.6, 0, 0.35);
        const keywordScore = batch.sourceType === 'keyword' ? 1.1 : 0;
        const countryBoost = targetCountry ? (batch.originCountry === targetCountry ? 1.7 : 0) : 0;
        const score = batch.sourceWeight
          + genreOverlap * 1.6
          + (languageMatch ? 0.8 : 0)
          + keywordScore
          + countryBoost
          + qualityScore
          + popularityScore;

        const normalized: TmdbMediaItem = {
          ...rawItem,
          media_type: mediaType
        };

        const existing = scored.get(key);
        if (!existing || existing.score < score) {
          scored.set(key, { item: normalized, score });
        }
      }
    }

    const strictItems = Array.from(scored.values())
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.item)
      .slice(0, limit);

    if (strictItems.length) {
      const countryPart = targetCountry ? ` from ${targetCountry}` : '';
      return {
        items: strictItems,
        reason: `Up next matches your current title: same genre and similar theme${countryPart}.`
      };
    }

    return {
      items: [],
      reason: 'Strict mode is on: no same-country, same-genre matches found right now.'
    };
  }

  private buildProfile(history: WatchedItem[]): UserProfile {
    const seedItems = history.slice(0, 4);
    const genreScores = new Map<number, number>();
    const languageScores = new Map<string, number>();
    const countryScores = new Map<string, number>();

    for (let index = 0; index < history.length; index += 1) {
      const entry = history[index];
      const recencyWeight = 1 / (index + 1);
      const ratingWeight = Number.isFinite(entry.vote_average) ? Math.max(0.5, (entry.vote_average as number) / 10) : 0.8;
      const weight = recencyWeight * ratingWeight;

      for (const genreId of entry.genres) {
        genreScores.set(genreId, (genreScores.get(genreId) || 0) + weight);
      }

      if (entry.original_language) {
        languageScores.set(entry.original_language, (languageScores.get(entry.original_language) || 0) + weight);
      }

      for (const country of entry.origin_countries || []) {
        countryScores.set(country, (countryScores.get(country) || 0) + (weight * 1.2));
      }
    }

    return {
      seedItems,
      topGenres: this.topKeys(genreScores, 3),
      topLanguages: this.topKeys(languageScores, 2),
      topCountries: this.topKeys(countryScores, 2),
      dominantType: this.pickDominantMediaType(history)
    };
  }

  private async loadBatches(profile: UserProfile): Promise<RecommendationBatch[]> {
    const tasks: Array<Promise<RecommendationBatch>> = [];

    profile.seedItems.forEach((seed, index) => {
      const seedAgeDays = Math.max(0, (Date.now() - seed.watched_at) / (1000 * 60 * 60 * 24));
      tasks.push(
        this.tmdb.getRecommendations(seed.media_type, seed.id).then(response => ({
          items: response?.results || [],
          sourceWeight: 3.5 - index * 0.6,
          sourceType: 'seed' as const,
          seedAgeDays
        }))
      );
    });

    profile.topGenres.forEach((genreId, index) => {
      tasks.push(
        this.tmdb.getDiscover(profile.dominantType, {
          genreId,
          originCountry: profile.topCountries[0],
          originalLanguage: profile.topLanguages[0],
          minRating: 6.2,
          page: 1
        }).then(response => ({
          items: response?.results || [],
          sourceWeight: 2.4 - index * 0.4,
          sourceType: 'genre' as const
        }))
      );
    });

    if (profile.topLanguages.length) {
      tasks.push(
        this.tmdb.getDiscover(profile.dominantType, {
          originCountry: profile.topCountries[0],
          originalLanguage: profile.topLanguages[0],
          minRating: 6.5,
          page: 1
        }).then(response => ({
          items: response?.results || [],
          sourceWeight: 1.7,
          sourceType: 'language' as const
        }))
      );
    }

    if (profile.topCountries.length) {
      profile.topCountries.forEach((originCountry, index) => {
        tasks.push(
          this.tmdb.getDiscover(profile.dominantType, {
            originCountry,
            originalLanguage: profile.topLanguages[0],
            minRating: 6,
            page: 1
          }).then(response => ({
            items: response?.results || [],
            sourceWeight: 2.3 - index * 0.35,
            sourceType: 'country' as const
          }))
        );
      });
    }

    tasks.push(
      (profile.dominantType === 'movie' ? this.tmdb.getPopularMovies(1) : this.tmdb.getPopularTv(1)).then(response => ({
        items: response?.results || [],
        sourceWeight: 1,
        sourceType: 'fallback' as const
      }))
    );

    return Promise.all(tasks);
  }

  private scoreCandidates(
    batches: RecommendationBatch[],
    profile: UserProfile,
    watchedKeys: Set<string>
  ): Map<string, ScoredRecommendation> {
    const scored = new Map<string, ScoredRecommendation>();

    for (const batch of batches) {
      for (const rawItem of batch.items) {
        const id = Number(rawItem?.id);
        if (!Number.isFinite(id) || id <= 0) continue;

        const mediaType = this.resolveMediaType(rawItem, profile.dominantType);
        const key = this.itemKey(id, mediaType);
        if (watchedKeys.has(key)) continue;

        const normalized: TmdbMediaItem = {
          ...rawItem,
          media_type: mediaType
        };

        const overlapScore = this.genreOverlapScore(normalized.genre_ids || [], profile.topGenres);
        const languageScore = profile.topLanguages.includes(normalized.original_language || '') ? 0.55 : 0;
        const countryScore = this.countryMatchScore(batch, profile.topCountries);
        const qualityScore = this.normalizeRange(Number(normalized.vote_average) || 0, 0, 10, 0, 1.2);
        const popularityScore = this.normalizeRange(Math.log10((Number(normalized.popularity) || 0) + 1), 0, 2.6, 0, 0.45);
        const freshnessMultiplier = batch.seedAgeDays === undefined ? 1 : 1 / (1 + batch.seedAgeDays / 30);
        const sourceBoost = batch.sourceType === 'seed' ? 0.3 : 0;

        const score = (batch.sourceWeight + overlapScore + languageScore + countryScore + qualityScore + popularityScore + sourceBoost) * freshnessMultiplier;
        const existing = scored.get(key);

        if (!existing || existing.score < score) {
          scored.set(key, { item: normalized, score });
        }
      }
    }

    return scored;
  }

  private pickDiverseResults(scored: Map<string, ScoredRecommendation>, limit: number): TmdbMediaItem[] {
    const sorted = Array.from(scored.values()).sort((a, b) => b.score - a.score);
    const results: TmdbMediaItem[] = [];
    const primaryGenreCounts = new Map<number, number>();
    let movieCount = 0;
    let tvCount = 0;

    for (const candidate of sorted) {
      if (results.length >= limit) break;

      const mediaType = candidate.item.media_type || 'movie';
      const primaryGenre = candidate.item.genre_ids?.[0];
      const genreCount = primaryGenre ? (primaryGenreCounts.get(primaryGenre) || 0) : 0;
      const isTypeImbalanced = mediaType === 'movie' ? movieCount > tvCount + 3 : tvCount > movieCount + 3;

      if (genreCount >= 3 && results.length < limit - 2) continue;
      if (isTypeImbalanced && results.length < limit - 2) continue;

      if (primaryGenre) {
        primaryGenreCounts.set(primaryGenre, genreCount + 1);
      }

      if (mediaType === 'movie') movieCount += 1;
      if (mediaType === 'tv') tvCount += 1;
      results.push(candidate.item);
    }

    if (results.length >= limit) {
      return results.slice(0, limit);
    }

    for (const candidate of sorted) {
      if (results.length >= limit) break;
      if (results.some(item => item.id === candidate.item.id && item.media_type === candidate.item.media_type)) continue;
      results.push(candidate.item);
    }

    return results;
  }

  private buildReason(profile: UserProfile): string {
    const seedTitle = profile.seedItems[0]?.title || profile.seedItems[0]?.name || 'your recent watch history';

    if (profile.topCountries.length && profile.topGenres.length) {
      return `Based on ${seedTitle}, weighted by your preferred origin country and genres.`;
    }

    if (profile.topGenres.length && profile.topLanguages.length) {
      return `Based on what you watched recently: ${seedTitle}, with your favorite genres and language preferences.`;
    }

    if (profile.topGenres.length) {
      return `Recommended from your recent watch pattern, starting with ${seedTitle}.`;
    }

    return `Recommended because you watched ${seedTitle}.`;
  }

  private buildCacheKey(history: WatchedItem[], limit: number): string {
    const top = history.slice(0, 8).map(item => `${item.media_type}:${item.id}:${item.watched_at}`).join('|');
    return `${limit}:${top}`;
  }

  private resolveMediaType(item: TmdbMediaItem, fallback: MediaType): MediaType {
    if (item.media_type === 'movie' || item.media_type === 'tv') {
      return item.media_type;
    }
    return item.name && !item.title ? 'tv' : fallback;
  }

  private topKeys<T extends string | number>(scores: Map<T, number>, limit: number): T[] {
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key]) => key);
  }

  private genreOverlapScore(itemGenres: number[], preferredGenres: number[]): number {
    if (!itemGenres.length || !preferredGenres.length) return 0;
    const preferred = new Set(preferredGenres);
    const overlapCount = itemGenres.filter(genre => preferred.has(genre)).length;
    return overlapCount * 0.55;
  }

  private countGenreOverlap(itemGenres: number[], preferredGenres: number[]): number {
    if (!itemGenres.length || !preferredGenres.length) return 0;
    const preferred = new Set(preferredGenres);
    return itemGenres.filter(genre => preferred.has(genre)).length;
  }

  private countryMatchScore(batch: RecommendationBatch, preferredCountries: string[]): number {
    if (!preferredCountries.length) return 0;
    if (batch.sourceType === 'country') return 0.95;
    if (batch.sourceType === 'genre' || batch.sourceType === 'language') return 0.28;
    return 0;
  }

  private normalizeRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    if (inMax <= inMin) return outMin;
    const normalized = Math.min(1, Math.max(0, (value - inMin) / (inMax - inMin)));
    return outMin + normalized * (outMax - outMin);
  }

  private pickDominantMediaType(history: Array<{ media_type: MediaType }>): MediaType {
    const movieCount = history.filter(item => item.media_type === 'movie').length;
    const tvCount = history.length - movieCount;
    return tvCount > movieCount ? 'tv' : 'movie';
  }

  private itemKey(id: number, mediaType: MediaType): string {
    return `${mediaType}:${id}`;
  }
}