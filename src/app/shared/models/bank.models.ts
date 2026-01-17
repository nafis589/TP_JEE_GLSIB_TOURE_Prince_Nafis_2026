export interface Client {
    id: string;
    nom: string;
    prenom: string;
    firstName?: string; // Pour compatibilité backend
    lastName?: string;  // Pour compatibilité backend
    dateNaissance: Date;
    birthDate?: string; // Pour compatibilité backend
    sexe: 'M' | 'F';
    gender?: 'M' | 'F'; // Pour compatibilité backend
    adresse: string;
    address?: string; // Pour compatibilité backend
    telephone: string;
    phoneNumber?: string; // Pour compatibilité backend
    email: string;
    nationalite: string;
    nationality?: string; // Pour compatibilité backend
    dateInscription: Date;
    statut: 'Actif' | 'Suspendu';
}

export interface Compte {
    id: string;
    numeroCompte: string;
    solde: number;
    type: 'COURANT' | 'EPARGNE';
    dateCreation: Date;
    clientId: string;
    clientNom?: string;
    devise: string;
    statut: 'ACTIF' | 'BLOQUE';
}

export interface Transaction {
    id: string;
    type: 'DEPOT' | 'RETRAIT' | 'VIREMENT' | 'TRANSFER';
    montant: number;
    amount?: number; // Backend compatibility
    date: Date;
    description: string;
    compteSource?: string;
    accountNumber?: string; // Backend compatibility (source)
    compteDestination?: string;
    targetAccountNumber?: string; // Backend compatibility
    statut: 'SUCCESS' | 'PENDING' | 'FAILED' | 'COMPLETED';
}

export interface Releve {
    id: string;
    compteId: string;
    numeroCompte?: string;
    dateDebut: Date;
    dateFin: Date;
    soldeInitial: number;
    soldeFinal: number;
    transactions: Transaction[];
}

// Map helpers for services
export function mapClientFromBackend(b: any): Client {
    return {
        id: b.id,
        nom: b.lastName || b.nom,
        prenom: b.firstName || b.prenom,
        dateNaissance: new Date(b.birthDate || b.dateNaissance),
        sexe: b.gender || b.sexe,
        adresse: b.address || b.adresse,
        telephone: b.phoneNumber || b.telephone,
        email: b.email,
        nationalite: b.nationality || b.nationalite,
        dateInscription: new Date(b.dateInscription || Date.now()),
        statut: b.statut || 'Actif'
    };
}

export function mapTransactionFromBackend(b: any): Transaction {
    return {
        id: b.id,
        type: b.type,
        montant: b.amount || b.montant,
        date: new Date(b.date || b.timestamp),
        description: b.description,
        compteSource: b.accountNumber || b.compteSource,
        compteDestination: b.targetAccountNumber || b.compteDestination,
        statut: b.status || b.statut || 'SUCCESS'
    };
}
