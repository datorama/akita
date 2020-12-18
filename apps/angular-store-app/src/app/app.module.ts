import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { ProductPageComponent } from './product-page/product-page.component';
import { NavComponent } from './nav/nav.component';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { HttpMethod, NG_ENTITY_SERVICE_CONFIG, NgEntityServiceGlobalConfig } from '@datorama/akita-ng-entity-service';
import { AkitaNgRouterStoreModule } from '@datorama/akita-ng-router-store';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';
import { CartEffects } from './cart/state/cart.effects';
import { AkitaNgEffectsModule } from '@datorama/akita-ng-effects';

@NgModule({
  declarations: [AppComponent, NavComponent, ProductPageComponent],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    ProductsModule,
    CartModule,
    AuthModule,
    AkitaNgRouterStoreModule,
    AkitaNgDevtools.forRoot(),
    // ERROR in Error during template compile of 'AppModule'
    // Function calls are not supported in decorators but 'AkitaNgEffectsModule' was called.
    // An Angular update will fix this;
    AkitaNgEffectsModule.forRoot([CartEffects])
  ],
  providers: [
    AuthGuard,
    {
      provide: NG_ENTITY_SERVICE_CONFIG,
      useFactory: function() {
        return {
          baseUrl: 'https://jsonplaceholder.typicode.com',
          httpMethods: {
            PUT: HttpMethod.PATCH
          }
        } as NgEntityServiceGlobalConfig;
      },
      deps: []
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
