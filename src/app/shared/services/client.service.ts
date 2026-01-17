import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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

    getClientById(id: string): Observable<Client> {
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map(mapClientFromBackend)
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

    suspendClient(id: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/suspend`, {});
    }

    activateClient(id: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}/activate`, {});
    }
}
