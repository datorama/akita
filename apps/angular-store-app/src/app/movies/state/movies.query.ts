import { Injectable } from '@angular/core';
import { combineQueries, EntityUIQuery, QueryEntity } from '@datorama/akita';
import { map } from 'rxjs/operators';
import { ActorsQuery } from '../actors/state/actors.query';
import { GenresQuery } from '../genres/state/genres.query';
import { MoviesState, MoviesStore, MoviesUIState } from './movies.store';

@Injectable({ providedIn: 'root' })
export class MoviesQuery extends QueryEntity<MoviesState> {
  ui: EntityUIQuery<MoviesUIState>;

  constructor(protected store: MoviesStore, private readonly actorsQuery: ActorsQuery, private readonly genresQuery: GenresQuery) {
    super(store);
    this.createUIQuery();
  }

  selectMovies() {
    return combineQueries([this.selectAll(), this.actorsQuery.selectAll({ asObject: true }), this.genresQuery.selectAll({ asObject: true })]).pipe(
      map(([movies, actors, genres]) => {
        return movies.map((movie) => {
          return {
            ...movie,
            actors: movie.actors.map((actorId) => actors[actorId]),
            genres: movie.genres.map((genreId) => genres[genreId]),
          };
        });
      })
    );
  }
}
