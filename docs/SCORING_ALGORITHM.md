# Technical Documentation: Matchmaking & Suggestion Algorithm

## 1. Overview

The objective of this algorithm is to propose relevant sports sessions to users. It does not merely filter results, but uses a **Scoring (Weighting) system** to rank sessions from most to least relevant.

The algorithm operates according to a **hybrid approach**:

- **Strict Filters (The Bouncer)**: Eliminates sessions that do not meet blocking criteria (Max distance, Impossible date, Explicitly filtered sport).
- **Soft Scoring (The Judge)**: Assigns points to remaining sessions based on user preferences (Profile, Time habits, Proximity).

---

## 2. The Scoring System (Weighting)

The core of the algorithm is based on point attribution. **The higher the score, the higher the session appears in the list.**

| Criterion               | Points  | Condition                                                                               |
| ----------------------- | ------- | --------------------------------------------------------------------------------------- |
| **Sport**               | +1000   | If the sport matches the active filter OR user profile preferences.                     |
| **Text Search**         | +500    | Based on fuzzy matching (word_similarity) between input and field name / session title. |
| **Exact Date**          | +200    | If the session is exactly on the requested day (Discovery Mode).                        |
| **High Urgency**        | +100    | If the session starts within 6 hours (Urgent Mode).                                     |
| **Date Range**          | +100    | If the session is within the requested date range.                                      |
| **Adjacent Date**       | +50     | If the session is on D+1 or D+2 from the target date.                                   |
| **Medium Urgency**      | +50     | If the session starts within 24 hours (Urgent Mode).                                    |
| **Distance**            | 0 to 50 | Dynamic score: +50 if user is on the field, decreases linearly to 0 at max distance.    |
| **Time Preference**     | +30     | If the match time matches playing habits (e.g., Evening, Morning).                      |
| **Freshness (Default)** | +10     | If the session is within the next 48 hours (Standard Mode).                             |

---

## 3. Detailed Business Logic

### A. Fuzzy Search & "Smart Search"

To handle typing errors (e.g., "hops" instead of "Hoops") or missing spaces (e.g., "court1" instead of "Court 1"), the algorithm uses **three levels of comparison**:

1. **Word Similarity**: Compares input with each word in the field name (allows finding "Hoopsfactory" by typing "hops").
2. **Normalization (Spaceless)**: Compares input and name by removing all spaces (allows matching "court1" with "Court 1").
3. **ILIKE Fallback**: A standard text search engine to guarantee exact matches.

**Implementation**: Uses PostgreSQL `pg_trgm` extension with configurable similarity threshold (`WORD_SIMILARITY_THRESHOLD: 0.3`).

---

### B. Sports Management (Filter vs Profile)

The algorithm adapts dynamically based on user action:

#### Case 1: User uses the search bar (Active Filter)

- **Action**: A STRICT SQL filter is applied. Only requested sports are returned.
- **Score**: Filtered sports receive the bonus (+1000). Profile preferences are ignored.

#### Case 2: User browses (No filter)

- **Action**: No strict filter. All available sports around them are displayed.
- **Score**: Sports in their Profile receive the bonus (+1000) to appear first.

---

### C. Date Management (Lazy Evaluation)

Temporal logic is optimized to calculate only what is necessary:

#### Range Search (Start & End)

Strict filter between two dates. All sessions outside this range are eliminated.

#### Discovery Search (Start only)

- Targets the requested date (+200 pts)
- Opens a 2-day tolerance window (+50 pts for adjacent dates)

#### Default Search (No date)

- **Normal Mode**: Favors sessions within the next 48 hours (`DEFAULT_WINDOW_MS`).
- **Urgent Mode** (`urgent=true`): Favors imminent sessions (<6h and <24h).

---

### D. Time Preferences

The system manages **two types of user availability**:

- **RECURRENT**: Based on day of week (e.g., "I play Monday evenings"). Algorithm compares DOW (Day of Week) in SQL.
- **ONE_TIME**: Based on specific date (e.g., "I want to play December 25"). Algorithm compares exact date (`pref.date`).

**Bonus**: +30 points if session time matches a registered time preference.

---

### E. Geolocation

**Technology**: Uses PostGIS and `ST_DistanceSphere` function for accurate Earth curvature calculation.

**Logic**:

1. Calculate raw distance (in meters).
2. Strict filter (`WHERE distance < maxDistance`).
3. Calculate proximity score (linear decrease from +50 to 0).
4. Return: Exact distance is sent to frontend (rounded to nearest integer).

**Configuration**: `MAX_DISTANCE_METERS: 30000` (30 km by default).

---

## 4. Technical Architecture

### Stack

- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL + PostGIS
- **ORM**: Prisma

### Data Flow

```
Controller (findAllSuggestions)
    ↓
    Receives parameters via SessionSuggestionFilterDto
    Cleans data (Transform strings to arrays, parse booleans)
    ↓
Service (findAllSessionsSuggestions)
    ↓
    1. Retrieves user preferences (Profile & Time preferences)
    2. Builds raw SQL query (Prisma.sql) by conditional blocks
    3. Executes $queryRaw to retrieve ranked IDs and raw distance
    4. Hydrates complete data via findMany
    ↓
Mapper (SessionMapper)
    ↓
    Merges session data with calculated distance
    Formats output object strictly according to DTO
    ↓
Response (PaginatedDataDto<SessionCollectionItemDto>)
```

### Performance Optimizations

- **Raw SQL ($queryRaw)**: Score and distance calculations happen directly in the database, which is much faster than doing it in JavaScript.
- **Pagination (Cursor-based)**: Uses a cursor for performant infinite scrolling.
- **Lazy Loading of Dates**: Time variables (High/Medium limits) are only instantiated if Urgent mode is enabled.
- **Indexing**: Columns `sport`, `startDate`, `endDate` and geographic coordinates should be indexed for optimal performance.

---

## 5. Configuration

All algorithm constants are centralized in `SESSION_SUGGESTION_CONFIG`:

**File**: `src/sessions/constants/session.constants.ts`

### Configurable Parameters

```typescript
SCORES: {
  DATE_RANGE_MATCH: 100,        // Standard date range
  DATE_TARGET_ADJACENT: 50,     // Adjacent dates (D+1, D+2)
  DATE_TARGET_EXACT: 200,       // Exact date
  DISTANCE_MAX_POINTS: 50,      // Max proximity bonus
  SEARCH_MAX_POINTS: 500,       // Max search bonus
  SPORT_MATCH: 1000,            // Sport bonus (max priority)
  TIME_PREFERENCE: 30,          // Time preference bonus
  URGENCY_DEFAULT: 10,          // Default urgency (<48h)
  URGENCY_HIGH: 100,            // High urgency (<6h)
  URGENCY_MEDIUM: 50,           // Medium urgency (<24h)
}

THRESHOLDS: {
  DEFAULT_WINDOW_MS: 2 * 24 * 60 * 60 * 1000,    // 2 days
  MAX_DISTANCE_METERS: 30000,                     // 30 km
  URGENCY_HIGH_MS: 6 * 60 * 60 * 1000,            // 6 hours
  URGENCY_MEDIUM_MS: 24 * 60 * 60 * 1000,         // 24 hours
  WORD_SIMILARITY_THRESHOLD: 0.3,                 // 30% for pg_trgm
}
```

### Recommended Adjustments

To modify application behavior, simply edit `SESSION_SUGGESTION_CONFIG`:

- **Make urgency stricter**: Reduce `URGENCY_HIGH_MS` and `URGENCY_MEDIUM_MS`.
- **Increase distance importance**: Increase `DISTANCE_MAX_POINTS`.
- **Favor profile sports**: Increase `SPORT_MATCH`.
- **Expand search window**: Increase `DEFAULT_WINDOW_MS`.
- **Improve fuzzy search**: Reduce `WORD_SIMILARITY_THRESHOLD` (more permissive).

---

## 6. Practical Use Cases

### Example 1: Simple Sport Search

**Input**: User clicks on "Football"

- Strict filter applied: `WHERE sport = 'FOOTBALL'`
- +1000 bonus for all football sessions
- Ranking by descending score

### Example 2: Urgent Search

**Input**: `urgent=true`, `userLat=48.8566`, `userLon=2.3522`

- Reduced time window: Sessions < 6h and < 24h
- Urgency bonus applied (+100 or +50)
- Ranking by proximity and urgency

### Example 3: Discovery with Preferences

**Input**: `startDate=2025-01-20`, no sport filter

- Targets January 20 (+200 pts)
- Tolerance window: January 18-22 (+50 pts)
- Sport bonus for profile preferences (+1000 pts)
- Time bonus if matches habits (+30 pts)

---

## 7. Maintenance & Debugging

### Recommended Logs

- Number of sessions before/after strict filters
- Final score of each session
- Calculated distance vs max distance
- SQL query execution time

### Tests

- Check edge cases (distance exactly at limit, urgency at 6:00am)
- Test with profiles without preferences
- Validate fuzzy search with common typos

### Monitoring

- Monitor SQL query times (target: < 200ms)
- Check score distribution (avoid clusters)
- Analyze click-through rates to refine scoring weights

---

## 8. Future Improvements

- **Machine Learning**: Integrate a ranking model based on user clicks
- **Dynamic Scoring**: Adapt weights based on time of day or season
- **Social Recommendations**: Bonus for sessions with friends or similar players
- **Capacity Prediction**: Favor sessions close to their max capacity
