import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PaginatorPlugin } from '@datorama/akita';
import { combineLatest } from 'rxjs';
import { startWith, switchMap, tap } from 'rxjs/operators';
import { CONTACTS_PAGINATOR } from '../state/contacts.pagination';
import { ContactsQuery } from '../state/contacts.query';
import { ContactsService } from '../state/contacts.service';
import { ContactState } from '../state/contacts.store';

@Component({
  selector: 'app-contacts-page',
  templateUrl: './contacts-page.component.html',
  styleUrls: ['./contacts-page.component.css'],
})
export class ContactsPageComponent implements OnInit {
  pagination$;
  sortByControl: FormControl;
  perPageControl: FormControl;

  constructor(
    contactsQuery: ContactsQuery,
    route: ActivatedRoute,
    @Inject(CONTACTS_PAGINATOR) public paginatorRef: PaginatorPlugin<ContactState>,
    private readonly contactsService: ContactsService
  ) {}

  ngOnInit() {
    const sortByInit = this.paginatorRef.metadata.get('sortBy') || 'name';
    const perPageInit = this.paginatorRef.metadata.get('perPage') || '10';
    this.sortByControl = new FormControl(sortByInit);
    this.perPageControl = new FormControl(perPageInit);

    /**
     *
     * Example with the router
     *
     * */
    // this.route.queryParamMap.pipe(map(params => +params.get('page'))).subscribe(page => {
    //   this.paginator.setPage(page);
    // });

    /**
     *
     * Simple example without filters
     *
     * */
    // this.pagination$ = this.paginatorRef.pageChanges.pipe(
    //   switchMap(( page ) => {
    //     const req = () => this.contactsService.getPage({
    //       page,
    //       perPage: 10
    //     });
    //     return this.paginatorRef.getPage(req);
    //   })
    // );

    /**
     *
     * Advanced example with filters
     *
     * */
    const sort = this.sortByControl.valueChanges.pipe(startWith(sortByInit));
    const perPage = this.perPageControl.valueChanges.pipe(startWith(+perPageInit));

    this.pagination$ = combineLatest(this.paginatorRef.pageChanges, combineLatest(sort, perPage).pipe(tap((_) => this.paginatorRef.clearCache()))).pipe(
      switchMap(([page, [sortBy, perPage]]) => {
        const req = () =>
          this.contactsService.getPage({
            page,
            sortBy,
            perPage,
          });
        this.paginatorRef.metadata.set('sortBy', sortBy);
        this.paginatorRef.metadata.set('perPage', perPage);
        return this.paginatorRef.getPage(req);
      })
    );
  }

  ngOnDestroy() {
    this.paginatorRef.destroy();
  }
}
