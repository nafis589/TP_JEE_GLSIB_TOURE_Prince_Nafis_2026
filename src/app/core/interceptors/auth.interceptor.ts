import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(private authService: AuthService, private router: Router) { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        // 1. Identifier si la requête est destinée aux endpoints d'authentification
        const isAuthRequest = request.url.includes('/auth/');

        // 2. Gestion du token : On n'ajoute pas le token pour les requêtes d'authentification (login/register)
        if (!isAuthRequest) {
            const token = this.authService.getToken();
            console.log('[AuthInterceptor] Request to:', request.url);
            console.log('[AuthInterceptor] Token exists:', !!token);
            if (token) {
                request = request.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                });
                console.log('[AuthInterceptor] Token added to request');
            } else {
                console.warn('[AuthInterceptor] No token available for request:', request.url);
            }
        }

        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                console.error('[AuthInterceptor] HTTP Error:', error.status, error.statusText);
                console.error('[AuthInterceptor] Error URL:', error.url);
                console.error('[AuthInterceptor] Error message:', error.error?.message || error.message);

                // 3. Gestion des erreurs 401 (Unauthorized) et 403 (Forbidden)
                // On n'intercepte PAS ces erreurs pour les requêtes /auth/* (login/register)
                // afin de laisser le composant gérer l'erreur (ex: afficher "Identifiants incorrects")
                // et surtout pour que le pipe finalize() du composant s'exécute normalement.
                if ((error.status === 401 || error.status === 403) && !isAuthRequest) {
                    console.warn('[AuthInterceptor] Accès non autorisé détecté sur une route protégée, redirection vers login...');
                    this.authService.logout();
                    this.router.navigate(['/auth/login']);
                }

                // Dans tous les cas, on renvoie l'erreur pour qu'elle soit traitée par l'appelant
                return throwError(() => error);
            })
        );
    }
}

