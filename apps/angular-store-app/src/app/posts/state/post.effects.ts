import { Injectable } from '@angular/core';
import { Actions, Effect } from '@datorama/akita-ng-effects';
import { PostsStore } from './posts.store';
import { tap } from 'rxjs/operators';

@Injectable()
export class PostEffects {
  constructor(private actions$: Actions, private postStore: PostsStore) {}

  @Effect({ dispatch: false })
  allActions = this.actions$.pipe(tap((action) => console.log('post effect', action)));
}
