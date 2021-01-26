import { Injectable } from '@angular/core';
import { action, ID } from '@datorama/akita';
import { VISIBILITY_FILTER } from '../filter/filter.model';
import { createTodo, Todo } from './todo.model';
import { TodosStore } from './todos.store';

@Injectable({ providedIn: 'root' })
export class TodosService {
  constructor(private readonly todosStore: TodosStore) {}

  @action('Update filter')
  updateFilter(filter: VISIBILITY_FILTER) {
    this.todosStore.update({
      ui: {
        filter,
      },
    });
  }

  complete({ id, completed }: Todo) {
    this.todosStore.update(id, { completed });
  }

  add(title: string) {
    const todo = createTodo(title);
    this.todosStore.add(todo);
  }

  delete(id: ID) {
    this.todosStore.remove(id);
  }

  checkAll(completed: boolean) {
    this.todosStore.update(null, {
      completed,
    });
  }

  move(index: number) {
    this.todosStore.move(index, index - 1);
  }
}
