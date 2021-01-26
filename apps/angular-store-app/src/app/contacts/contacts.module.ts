import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactsPageComponent } from './contacts-page/contacts-page.component';
import { RouterModule, Routes } from '@angular/router';
import { ContentLoaderModule } from '@netbasal/content-loader';
import { ReactiveFormsModule } from '@angular/forms';
import { AkitaNgEffectsModule } from '@datorama/akita-ng-effects';
import { ContactEffects } from './state/contact.effects';

const routes: Routes = [
  {
    path: '',
    component: ContactsPageComponent,
  },
];

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, ContentLoaderModule, RouterModule.forChild(routes), AkitaNgEffectsModule.forFeature([ContactEffects])],
  declarations: [ContactsPageComponent],
})
export class ContactsModule {}
