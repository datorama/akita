import { Inject, Injectable, Optional } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { coerceArray, filterNil, HashMap, logAction } from '@datorama/akita';
import { merge, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { defaultOptions, FormsManagerOptions, FORMS_MANAGER_OPTIONS } from './forms-manager-options';
import { FormsQuery } from './forms-manager.query';
import { FormsStore } from './forms-manager.store';

export type AkitaAbstractControl = Pick<
  AbstractControl,
  'value' | 'valid' | 'invalid' | 'disabled' | 'errors' | 'touched' | 'pristine' | 'pending' | 'dirty'
> & { rawValue: any };

export interface AkitaAbstractGroup<C = any> extends AkitaAbstractControl {
  controls: { readonly [P in keyof C]: AkitaAbstractControl };
}

export type ArrayControlFactory = (value: any) => AbstractControl;

@Injectable({
  providedIn: 'root',
})
export class AkitaNgFormsManager<FormsState = any> {
  private readonly _options: FormsManagerOptions;

  private readonly _store: FormsStore<FormsState>;

  private readonly _query: FormsQuery<FormsState>;

  private valueChanges: HashMap<Subscription> = {};

  private ngForms: HashMap<AbstractControl> = {};

  constructor(@Optional() @Inject(FORMS_MANAGER_OPTIONS) options: Partial<FormsManagerOptions> = {}) {
    this._options = { ...defaultOptions, ...options };
    this._store = new FormsStore({} as FormsState);
    this._query = new FormsQuery(this.store);
  }

  get query(): FormsQuery<FormsState> {
    return this._query;
  }

  get store(): FormsStore<FormsState> {
    return this._store;
  }

  selectValid(formName: keyof FormsState, path?: string): Observable<boolean> {
    return this.selectControl(formName, path).pipe(map((control) => control.valid));
  }

  selectDirty(formName: keyof FormsState, path?: string): Observable<boolean> {
    return this.selectControl(formName, path).pipe(map((control) => control.dirty));
  }

  selectDisabled(formName: keyof FormsState, path?: string): Observable<boolean> {
    return this.selectControl(formName, path).pipe(map((control) => control.disabled));
  }

  selectValue<T = any>(formName: keyof FormsState, path?: string): Observable<T> {
    return this.selectControl(formName, path).pipe(map((control) => control.value));
  }

  selectErrors(formName: keyof FormsState, path?: string): Observable<any> {
    return this.selectControl(formName, path).pipe(map((control) => control.errors));
  }

  selectNgForm(formName: keyof FormsState): Observable<AbstractControl> {
    return this.selectForm(formName, { filterNil: true }).pipe(map(() => this.ngForms[formName as any]));
  }

  /**
   * If no path specified it means that it's a single FormControl or FormArray
   */
  selectControl(formName: keyof FormsState, path?: string): Observable<AkitaAbstractControl> {
    if (!path) {
      return this.selectForm(formName);
    }
    return this.query
      .select((state) => state[formName as any])
      .pipe(
        filterNil,
        map((form) => this.resolveControl(form, path)),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
      );
  }

  getControl(formName: keyof FormsState, path?: string): AkitaAbstractControl {
    if (!path) {
      return this.getForm(formName);
    }

    if (this.hasForm(formName)) {
      const form = this.getForm(formName);
      return this.resolveControl(form, path);
    }

    return null;
  }

  selectForm(formName: keyof FormsState, options: { filterNil: true } = { filterNil: true }): Observable<AkitaAbstractGroup> {
    return this.query.select((state) => state[formName as any]).pipe(options.filterNil ? filterNil : (s): Observable<any> => s);
  }

  getForm<Name extends keyof FormsState>(formName: keyof FormsState): AkitaAbstractGroup<FormsState[Name]> {
    return this.query.getValue()[formName as any];
  }

  getNgForm(formName: keyof FormsState): AbstractControl {
    return this.ngForms[formName as any];
  }

  hasForm(formName: keyof FormsState): boolean {
    return !!this.getForm(formName);
  }

  upsert(
    formName: keyof FormsState,
    form: AbstractControl,
    config: {
      debounceTime?: number;
      emitEvent?: boolean;
      arrControlFactory?: ArrayControlFactory | HashMap<ArrayControlFactory>;
      persistForm?: boolean;
    } = {}
  ): this {
    const merged = { ...{ debounceTime: this._options.debounceTime, emitEvent: false }, ...config };

    /** If the form already exist, patch the form with the store value */
    if (this.hasForm(formName) === true) {
      form.patchValue(this.resolveStoreToForm(formName, form, merged.arrControlFactory), {
        emitEvent: merged.emitEvent,
      });
    } else {
      /** else update the store with the current form state */
      this.updateStore(formName, form, true);
      if (merged.persistForm) {
        this.storeFormInstance(formName, form);
      }
    }

    this.valueChanges[formName as any] = merge(form.valueChanges, form.statusChanges.pipe(distinctUntilChanged()))
      .pipe(debounceTime(merged.debounceTime))
      .subscribe(() => this.updateStore(formName, form));

    return this;
  }

  remove(formName?: keyof FormsState): void {
    if (formName) {
      this.removeFromStore(formName);
    } else {
      const availableForms = Object.keys(this.query.getValue());
      // eslint-disable-next-line no-restricted-syntax
      for (const name of availableForms) {
        this.removeFromStore(name as any);
      }
    }
    this.unsubscribe(formName);
  }

  unsubscribe(formName?: keyof FormsState, config: { removeNgForm?: boolean; updateStore?: boolean } = {}): void {
    const _config = {
      removeNgForm: true,
      ...{ updateStore: this._options.updateStoreOnUnsubscribe },
      ...config,
    };
    const _formName = formName as any;
    const removeInstance = (name: any): void | null => (_config.removeNgForm ? this.removeFormInstance(name) : null);

    if (_formName) {
      if (this.valueChanges[_formName]) {
        this.valueChanges[_formName].unsubscribe();
        delete this.valueChanges[_formName];
        if (config.updateStore && this.ngForms[_formName]) {
          this.updateStore(_formName, this.getNgForm(_formName));
        }
        removeInstance(_formName);
      }
    } else {
      // eslint-disable-next-line no-restricted-syntax
      for (const name of Object.keys(this.valueChanges) as any[]) {
        this.valueChanges[name].unsubscribe();
        if (config.updateStore && this.ngForms[name]) {
          this.updateStore(name, this.getNgForm(name));
        }
        removeInstance(name);
      }
      this.valueChanges = {};
    }
  }

  private removeFromStore(formName: keyof FormsState): void {
    const snapshot = this.query.getValue();
    const newState: Partial<FormsState> = Object.keys(snapshot).reduce((acc, currentFormName) => {
      if (formName !== currentFormName) {
        acc[currentFormName] = snapshot[currentFormName];
      }
      return acc;
    }, {});

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    logAction(`Remove ${formName}`);
    this.store._setState(() => newState as any);
  }

  private resolveControl(form, path: string): any {
    const [first, ...rest] = path.split('.');
    if (rest.length === 0) {
      return form.controls[first];
    }

    return this.find(form.controls[first], rest);
  }

  // eslint-disable-next-line class-methods-use-this
  private find(control: AkitaAbstractGroup, path: string[]): AkitaAbstractControl {
    return path.reduce((current: AkitaAbstractGroup, name: string) => {
      return Object.prototype.hasOwnProperty.call(current.controls, name) ? current.controls[name] : null;
    }, control);
  }

  private resolveStoreToForm(formName: keyof FormsState, control: AbstractControl, arrControlFactory: ArrayControlFactory | HashMap<ArrayControlFactory>): any {
    const form = this.getForm(formName);
    const { value } = form;
    /** It means it a single control */
    if (!form.controls) {
      return value;
    }

    this.handleFormArray(value, control, arrControlFactory);
    return value;
  }

  private handleFormArray(
    formValue: HashMap<any> | any[],
    control: AbstractControl,
    arrControlFactory: ArrayControlFactory | HashMap<ArrayControlFactory>
  ): void {
    if (control instanceof FormArray) {
      this.cleanArray(control);
      if (!arrControlFactory) {
        throw new Error('Please provide arrControlFactory');
      }
      // eslint-disable-next-line @typescript-eslint/ban-types
      formValue.forEach((v, i) => control.insert(i, (arrControlFactory as Function)(v)));
    } else {
      Object.keys(formValue).forEach((controlName) => {
        const value = formValue[controlName];
        if (Array.isArray(value) && control.get(controlName) instanceof FormArray === true) {
          if (!arrControlFactory || (arrControlFactory && controlName in arrControlFactory === false)) {
            throw new Error(`Please provide arrControlFactory for ${controlName}`);
          }
          const current = control.get(controlName) as FormArray;
          const fc = arrControlFactory[controlName];
          this.cleanArray(current);
          value.forEach((v, i) => current.insert(i, fc(v)));
        }
      });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  private cleanArray(control: FormArray): void {
    while (control.length !== 0) {
      control.removeAt(0);
    }
  }

  private buildFormStoreState(
    formName: keyof FormsState,
    form: AbstractControl
  ): AkitaAbstractControl | (AkitaAbstractControl & { controls: Record<string, unknown> }) {
    if (form instanceof FormControl) {
      return this.resolveFormToStore(form);
    }

    let value: AkitaAbstractControl & { controls: Record<string, unknown> };

    if (form instanceof FormGroup || form instanceof FormArray) {
      // The root form group
      value = {
        ...this.resolveFormToStore(form),
        controls: {},
      };

      // eslint-disable-next-line no-restricted-syntax
      for (const key of Object.keys(form.controls)) {
        const control = form.controls[key];
        if (control instanceof FormGroup || form instanceof FormArray) {
          value.controls[key] = this.buildFormStoreState(formName, control);
        } else {
          value.controls[key] = this.resolveFormToStore(control);
        }
      }
    }

    return value;
  }

  private updateStore(formName: keyof FormsState, form: AbstractControl, initial = false): void {
    const value = this.buildFormStoreState(formName, form);
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    const capitalized: string = formName[0].toUpperCase() + (formName as any).slice(1);
    const action = `${initial ? 'Create' : 'Update'} ${capitalized} Form`;
    logAction(action);
    this.store.update({
      [formName]: value,
    } as any);
  }

  private resolveFormToStore(control: Partial<AbstractControl>): AkitaAbstractControl {
    return {
      value: this.cloneValue(control.value), // Clone object to prevent issue with third party that would be affected by store freezing.
      rawValue: (control as any).getRawValue ? (control as any).getRawValue() : null,
      valid: control.valid,
      dirty: control.dirty,
      invalid: control.invalid,
      disabled: control.disabled,
      errors: control.errors,
      touched: control.touched,
      pristine: control.pristine,
      pending: control.pending,
    };
  }

  private cloneValue(value: any): any {
    if (this.isObject(value)) {
      return { ...value };
    }
    if (Array.isArray(value)) {
      return [...value];
    }
    // TODO this doesn't clone the value, bug?
    return value;
  }

  // TODO isObject() determines that it's an object or a function? That's a bit odd...
  // eslint-disable-next-line @typescript-eslint/ban-types
  private isObject(value: any): value is object | Function {
    if (value == null) {
      return false;
    }
    if (Array.isArray(value)) {
      return false;
    }
    return typeof value === 'function' || typeof value === 'object';
  }

  private storeFormInstance(formName: keyof FormsState, form: AbstractControl): void {
    const newForms = {
      ...this.ngForms,
      [formName as any]: form,
    };

    this.ngForms = newForms;
  }

  private removeFormInstance(formName: keyof FormsState): void {
    if (this.ngForms[formName as any]) {
      delete this.ngForms[formName as any];
    }
  }
}

export function setValidators(control: AbstractControl, validator: ValidatorFn | ValidatorFn[] | null): void {
  control.setValidators(coerceArray(validator));
  control.updateValueAndValidity();
}

export function setAsyncValidators(control: AbstractControl, validator: AsyncValidatorFn | AsyncValidatorFn[] | null): void {
  control.setValidators(coerceArray(validator));
  control.updateValueAndValidity();
}
