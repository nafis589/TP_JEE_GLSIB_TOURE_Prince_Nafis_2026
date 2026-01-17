import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, map, switchMap, catchError } from 'rxjs/operators';
import { AuthUser, UserRole } from './auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = environment.apiUrl;
    private currentUserSubject: BehaviorSubject<AuthUser | null>;
    public currentUser$: Observable<AuthUser | null>;

    constructor(private http: HttpClient) {
        const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
        const savedUser = isBrowser ? localStorage.getItem('currentUser') : null;
        this.currentUserSubject = new BehaviorSubject<AuthUser | null>(savedUser ? JSON.parse(savedUser) : null);
        this.currentUser$ = this.currentUserSubject.asObservable();
    }

    public get currentUserValue(): AuthUser | null {
        return this.currentUserSubject.value;
    }

    login(username: string, password: string): Observable<AuthUser> {
        console.log('AuthService: Attempting login for', username);
        return this.http.post<any>(`${this.apiUrl}/auth/login`, { username, password })
            .pipe(

                map(response => {
                    console.log('AuthService: Login success response:', response);

                    if (!response || (!response.token && !response.accessToken)) {
                        throw new Error('Réponse invalide du serveur (token manquant).');
                    }

                    const token = response.token || response.accessToken;
                    let role = response.role || response.user?.role || this.decodeRoleFromToken(token);

                    // Normalisation du rôle
                    if (role) {
                        role = role.toUpperCase().replace('ROLE_', '') as UserRole;
                    } else {
                        role = 'CLIENT';
                    }

                    const user: AuthUser = {
                        id: response.id || response.user?.id || '',
                        username: response.username || response.user?.username || username,
                        nom: response.lastName || response.user?.lastName || response.nom || '',
                        prenom: response.firstName || response.user?.firstName || response.prenom || '',
                        email: response.email || response.user?.email || '',
                        role: role as UserRole,
                        token: token
                    };

                    this.saveUser(user);
                    return user;
                }),
                catchError(err => {
                    console.error('AuthService: Login error:', err);
                    // On s'assure que l'erreur est propagée correctement
                    return throwError(() => err);
                }),

            );
    }

    /**
     * Optionnel: Rafraîchir les infos du profil si nécessaire
     */
    fetchUserProfile(): Observable<AuthUser | null> {
        const currentUser = this.currentUserValue;
        if (!currentUser || currentUser.role !== 'CLIENT') return of(currentUser);

        return this.http.get<any>(`${this.apiUrl}/clients/me`).pipe(
            map(profile => {
                const fullUser = {
                    ...currentUser,
                    id: profile.id || currentUser.id,
                    nom: profile.lastName || profile.nom || currentUser.nom,
                    prenom: profile.firstName || profile.prenom || currentUser.prenom,
                    email: profile.email || currentUser.email
                };
                this.saveUser(fullUser);
                return fullUser;
            }),
            catchError(err => {
                console.warn('AuthService: Could not fetch profile profile:', err);
                return of(currentUser);
            })
        );
    }

    private saveUser(user: AuthUser) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('currentUser', JSON.stringify(user));
        }
        this.currentUserSubject.next(user);
    }

    register(userData: any): Observable<any> {
        console.log('AuthService: Registering user...', userData);
        return this.http.post<any>(`${this.apiUrl}/auth/register`, userData).pipe(
            tap(res => console.log('AuthService: Register response:', res)),
            catchError(err => {
                console.error('AuthService: Register error:', err);
                return throwError(() => err);
            })
        );
    }

    logout() {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('currentUser');
        }
        this.currentUserSubject.next(null);
    }

    isAuthenticated(): boolean {
        return !!this.currentUserValue;
    }

    getUserRole(): UserRole | null {
        return this.currentUserValue ? this.currentUserValue.role : null;
    }

    getToken(): string | null {
        return this.currentUserValue ? this.currentUserValue.token || null : null;
    }

    private decodeRoleFromToken(token: string): UserRole {
        try {
            if (!token || !token.includes('.')) throw new Error('Invalid token');
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role) return payload.role;
            if (payload.roles && payload.roles.length > 0) {
                const r = payload.roles[0];
                return (typeof r === 'string' ? r : r.authority || r.role).replace('ROLE_', '') as UserRole;
            }
            if (payload.sub === 'admin' || payload.username === 'admin') return 'ADMIN';
            return 'CLIENT';
        } catch (e) {
            if (token && token.toLowerCase().includes('admin')) return 'ADMIN';
            return 'CLIENT';
        }
    }
}
