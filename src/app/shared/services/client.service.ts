import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, switchMap } from 'rxjs';
import { Client, mapClientFromBackend } from '../models/bank.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ClientService {
    private apiUrl = `${environment.apiUrl}/clients`;

    constructor(private http: HttpClient) { }

    // Admin: Liste tous les clients
    getClients(): Observable<Client[]> {
        return this.http.get<any[]>(this.apiUrl).pipe(
            map(clients => clients.map(mapClientFromBackend))
        );
    }

    createClient(clientData: any): Observable<Client> {
        // Souvent géré par POST /clients en admin
        return this.http.post<any>(this.apiUrl, clientData).pipe(
            map(mapClientFromBackend)
        );
    }

    // Client: Consulter mon profil
    getClientMe(): Observable<Client> {
        return this.http.get<any>(`${this.apiUrl}/me`).pipe(
            map(mapClientFromBackend)
        );
    }

    // Récupérer un client par ID - utilise la liste des clients comme fallback
    getClientById(id: string): Observable<Client> {
        // Essayer d'abord l'endpoint direct
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map(mapClientFromBackend),
            catchError((err) => {
                console.warn('[ClientService] Direct endpoint failed, using list fallback:', err);
                // Fallback: récupérer tous les clients et filtrer
                return this.getClients().pipe(
                    map(clients => {
                        const client = clients.find(c => c.id === id || c.id === String(id));
                        if (!client) {
                            throw new Error(`Client avec l'ID ${id} non trouvé`);
                        }
                        return client;
                    })
                );
            })
        );
    }

    updateClient(id: string, clientData: any): Observable<Client> {
        // Le backend attend firstName, lastName, etc.
        const body = {
            firstName: clientData.prenom || clientData.firstName,
            lastName: clientData.nom || clientData.lastName,
            email: clientData.email,
            address: clientData.adresse || clientData.address
        };
        return this.http.put<any>(`${this.apiUrl}/${id}`, body).pipe(
            map(mapClientFromBackend)
        );
    }

    searchClients(term: string): Observable<Client[]> {
        return this.getClients().pipe(
            map(clients => {
                const lowerTerm = term.toLowerCase();
                return clients.filter(c =>
                    c.nom.toLowerCase().includes(lowerTerm) ||
                    c.prenom.toLowerCase().includes(lowerTerm) ||
                    c.email.toLowerCase().includes(lowerTerm)
                );
            })
        );
    }

    deleteClient(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    // ADMIN: Suspendre un client
    // Endpoint: PUT /clients/{id}/suspend
    // Réponse API: { "message": "Client suspendu avec succès" }
    suspendClient(id: string): Observable<{ message: string }> {
        console.log('[ClientService] Suspending client:', id);
        return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/suspend`, {});
    }

    // ADMIN: Activer un client
    // Endpoint: PUT /clients/{id}/activate  
    // Réponse API: { "message": "Client réactivé avec succès" }
    activateClient(id: string): Observable<{ message: string }> {
        console.log('[ClientService] Activating client:', id);
        return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/activate`, {});
    }
}
