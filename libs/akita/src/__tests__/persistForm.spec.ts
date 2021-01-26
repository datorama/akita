import { Subject } from 'rxjs';
import { EntityStore, QueryEntity, StoreConfig } from '../lib/index';
import { FormGroupLike, PersistNgFormPlugin } from '../lib/plugins/persistForm/persistNgFormPlugin';

jest.useFakeTimers();

type Story = {
  title: string;
  story: string;
  draft: boolean;
  category: string;
};

function createStory() {
  return {
    title: '',
    story: '',
    draft: false,
    category: 'js',
  } as Story;
}

const formFactory = (): FormGroupLike => {
  const _changes = new Subject();

  return {
    value: undefined,
    setValue(v) {
      _changes.next(v);
      this.value = v;
    },
    patchValue(v) {
      _changes.next(v);
      this.value = v;
    },
    get valueChanges() {
      return _changes.asObservable();
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    get: () => {},
    controls: '',
  };
};

const formGroupA = formFactory();
const formGroupB = formFactory();

describe('PersistForm', () => {
  @StoreConfig({ name: 'stories' })
  class StoriesStore extends EntityStore<any, any> {
    constructor() {
      super({ config: { time: '', isAdmin: false } });
    }
  }

  class StoriesQuery extends QueryEntity<any, Story> {
    constructor(protected store) {
      super(store);
    }
  }

  const store = new StoriesStore();
  const query = new StoriesQuery(store);
  const customFormKey = 'customFormKey';
  const persistForm = new PersistNgFormPlugin(query, createStory).setForm(formGroupA); // default formKey
  const persistFormWithCustomKey = new PersistNgFormPlugin(query, createStory, { formKey: customFormKey }).setForm(formGroupB);

  it('should set the form initial state from the store', () => {
    expect(formGroupA.value).toEqual(createStory());
    expect(formGroupB.value).toEqual(createStory());
  });

  it('should persist the store with the form', () => {
    const patch = {
      title: 'test',
      story: 'test',
      draft: true,
      category: 'rx',
    };

    formGroupA.patchValue(patch);
    formGroupB.patchValue(patch);

    jest.runAllTimers();

    expect(query.getValue().akitaForm).toEqual(patch);
    expect(query.getValue()[customFormKey]).toEqual(patch);
  });

  it('should reset the form', () => {
    persistForm.reset();
    expect(query.getValue().akitaForm).toEqual(createStory());
    expect(formGroupA.value).toEqual(createStory());

    persistFormWithCustomKey.reset();
    expect(query.getValue()[customFormKey]).toEqual(createStory());
    expect(formGroupB.value).toEqual(createStory());
  });
});

describe('PersistForm - key based', () => {
  @StoreConfig({ name: 'stories' })
  class StoriesStore extends EntityStore<any, any> {
    constructor() {
      super({ config: { time: '', isAdmin: false } });
    }
  }

  class StoriesQuery extends QueryEntity<any, Story> {
    constructor(protected store) {
      super(store);
    }
  }

  const store = new StoriesStore();
  const query = new StoriesQuery(store);
  const formGroup = formFactory();

  const persistForm = new PersistNgFormPlugin(query, 'config').setForm(formGroup);

  it('should set the form initial state from the store', () => {
    expect(formGroup.value).toEqual({ time: '', isAdmin: false });
  });

  it('should persist the store with the form', () => {
    const patch = {
      time: 'time',
      isAdmin: true,
    };

    formGroup.patchValue(patch);
    jest.runAllTimers();

    expect(query.getValue().config).toEqual(patch);
  });

  it('should reset the form', () => {
    persistForm.reset();
    jest.runAllTimers();
    expect(query.getValue().config).toEqual({ time: '', isAdmin: false });
    persistForm.reset({ isAdmin: false, time: 'changed' });
    jest.runAllTimers();
    expect(query.getValue().config).toEqual({ time: 'changed', isAdmin: false });
  });
});

describe('PersistForm - key based nested key', () => {
  @StoreConfig({ name: 'stories' })
  class StoriesStore extends EntityStore<any, any> {
    constructor() {
      super({ config: { form: { name: '', isAdmin: false, type: 'type' } } });
    }
  }

  class StoriesQuery extends QueryEntity<any, Story> {
    constructor(protected store) {
      super(store);
    }
  }

  const store = new StoriesStore();
  const query = new StoriesQuery(store);

  const formGroup = formFactory();

  new PersistNgFormPlugin(query, 'config.form').setForm(formGroup);

  it('should persist only present in the form value properties', () => {
    const patch = {
      name: 'Ivan',
      isAdmin: true,
    };

    formGroup.patchValue(patch);
    jest.runAllTimers();

    expect(query.getValue().config.form.name).toEqual('Ivan');
    expect(query.getValue().config.form.isAdmin).toEqual(true);
    expect(query.getValue().config.form.type).not.toBeUndefined();
    expect(query.getValue().config.form.type).toEqual('type');
  });
});

describe('PersistForm - root key', () => {
  @StoreConfig({ name: 'stories' })
  class StoriesStore extends EntityStore<any, any> {
    constructor() {
      super({ someBoolean: true, other: 'Akita' });
    }
  }

  class StoriesQuery extends QueryEntity<any, Story> {
    constructor(protected store) {
      super(store);
    }
  }

  const store = new StoriesStore();
  const query = new StoriesQuery(store);

  const formGroup = formFactory();
  // simulate controls
  formGroup.patchValue({ someBoolean: false });
  const persistForm = new PersistNgFormPlugin(query).setForm(formGroup);

  it('should set the form initial state from the store', () => {
    expect(formGroup.value).toEqual({ someBoolean: true });
  });

  it('should persist the store with the form', () => {
    const patch = {
      someBoolean: false,
    };

    formGroup.patchValue(patch);
    jest.runAllTimers();

    expect(query.getValue().someBoolean).toEqual(patch.someBoolean);
    // it doesn't need to effect other props
    expect(query.getValue().other).toEqual('Akita');
  });

  it('should reset the form', () => {
    persistForm.reset();
    jest.runAllTimers();
    expect(query.getValue().someBoolean).toEqual(true);
    persistForm.reset({ someBoolean: false });
    jest.runAllTimers();
    expect(query.getValue().someBoolean).toEqual(false);
  });
});

describe('PersistForm - support rool level arrays', () => {
  @StoreConfig({ name: 'stories' })
  class StoriesStore extends EntityStore<any, any> {
    constructor() {
      super({ someBoolean: true, skills: ['js'] });
    }
  }

  class StoriesQuery extends QueryEntity<any, Story> {
    constructor(protected store) {
      super(store);
    }
  }

  const store = new StoriesStore();
  const query = new StoriesQuery(store);

  const formGroup = formFactory();
  // simulate controls
  formGroup.patchValue({ skills: [] });
  new PersistNgFormPlugin(query).setForm(formGroup);

  it('should set the form initial state from the store', () => {
    expect(formGroup.value).toEqual({ skills: ['js'] });
  });
});
