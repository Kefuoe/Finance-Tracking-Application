import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
     
    if (auth.isAuthenticated()) {
        return true;
    }

    // Not logged in → send to /login, remembering where they wanted to go.
    return router.createUrlTree(['/login'], { 
        queryParams: { returnUrl: state.url } 
    });
}