import { Injectable } from '@angular/core';
import { MoviesStore } from './movies.store';
import { ID, transaction, withTransaction, arrayRemove, logAction, action } from '@datorama/akita';
import { of, timer } from 'rxjs';
import { mapTo } from 'rxjs/operators';
import { movies } from '../normalized';
import { ActorsStore } from '../actors/state/actors.store';
import { GenresStore } from '../genres/state/genres.store';
import { MoviesQuery } from './movies.query';

@Injectable({ providedIn: 'root' })
export class MoviesService {
  constructor(private moviesStore: MoviesStore, private actorsStore: ActorsStore, private genresStore: GenresStore, private moviesQuery: MoviesQuery) {}

  getMovies() {
    const request$ = timer(1000).pipe(
      mapTo(movies),
      withTransaction((response) => {
        this.actorsStore.set(response.entities.actors);
        this.genresStore.set(response.entities.genres);
        const movies = {
          entities: response.entities.movies,
          ids: response.result,
        };
        this.moviesStore.set(movies);
      })
    );

    return this.moviesQuery.getHasCache() ? of() : request$;
  }

  @action('custom update actor name')
  updateActorName(id: ID, name: string) {
    this.actorsStore.update(id, { name });
  }

  @action('custom mark as open', { payload: { custom: 'payload' } })
  markAsOpen(id: ID) {
    this.moviesStore.ui.update(id, (entity) => ({ isOpen: !entity.isOpen }));
  }

  @transaction()
  deleteActor(id: ID) {
    logAction('custom remove actors', id, { custom: 'payload' });
    this.actorsStore.remove(id);
    this.moviesStore.update(null, (entity) => ({ actors: arrayRemove(entity.actors, id) }));
  }
}
