export interface Client {
    id: string;
    nom: string;
    prenom: string;
    firstName?: string;
    lastName?: string;
    dateNaissance: Date;
    birthDate?: string;
    sexe: 'M' | 'F';
    gender?: 'M' | 'F';
    adresse: string;
    address?: string;
    telephone: string;
    phoneNumber?: string;
    email: string;
    nationalite: string;
    nationality?: string;
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
    type: 'DEPOT' | 'RETRAIT' | 'VIREMENT' | 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL';
    montant: number;
    amount?: number;
    date: Date;
    description: string;
    compteSource?: string;
    accountNumber?: string;
    compteDestination?: string;
    targetAccountNumber?: string;
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

// ========== MAPPING FUNCTIONS ==========

export function mapClientFromBackend(b: any): Client {
    if (!b) return b;
    return {
        id: String(b.id || ''),
        nom: b.lastName || b.nom || '',
        prenom: b.firstName || b.prenom || '',
        dateNaissance: b.birthDate ? new Date(b.birthDate) : (b.dateNaissance ? new Date(b.dateNaissance) : new Date()),
        sexe: b.gender || b.sexe || 'M',
        adresse: b.address || b.adresse || '',
        telephone: b.phoneNumber || b.telephone || '',
        email: b.email || '',
        nationalite: b.nationality || b.nationalite || '',
        dateInscription: b.createdAt ? new Date(b.createdAt) : (b.dateInscription ? new Date(b.dateInscription) : new Date()),
        statut: b.status === 'SUSPENDED' ? 'Suspendu' : (b.status === 'ACTIVE' ? 'Actif' : (b.statut || 'Actif'))
    };
}

export function mapCompteFromBackend(b: any): Compte {
    if (!b) return b;

    // Le backend peut renvoyer accountNumber, accountType, balance, ownerName
    const type = (b.accountType || b.type || 'COURANT').toUpperCase();

    return {
        id: String(b.id || ''),
        numeroCompte: b.accountNumber || b.iban || b.numeroCompte || '',
        solde: Number(b.balance ?? b.solde ?? 0),
        type: type === 'EPARGNE' || type === 'SAVINGS' ? 'EPARGNE' : 'COURANT',
        dateCreation: b.createdAt ? new Date(b.createdAt) : (b.dateCreation ? new Date(b.dateCreation) : new Date()),
        clientId: String(b.clientId || b.client?.id || ''),
        // ownerName est fourni directement par l'API selon la documentation
        clientNom: b.ownerName || b.clientName || b.clientNom || (b.client ? `${b.client.firstName || ''} ${b.client.lastName || ''}`.trim() : '') || 'Non renseigné',
        devise: b.currency || b.devise || 'XOF',
        statut: (b.status || b.statut || 'ACTIF').toUpperCase() === 'ACTIVE' ? 'ACTIF' : (b.statut || 'ACTIF')
    };
}

export function mapTransactionFromBackend(b: any): Transaction {
    if (!b) return b;

    // Normaliser le type de transaction
    let transactionType = (b.type || 'DEPOT').toUpperCase();
    if (transactionType === 'DEPOSIT') transactionType = 'DEPOT';
    if (transactionType === 'WITHDRAWAL') transactionType = 'RETRAIT';
    if (transactionType === 'TRANSFER') transactionType = 'VIREMENT';

    return {
        id: String(b.id || ''),
        type: transactionType as any,
        montant: Number(b.amount ?? b.montant ?? 0),
        date: b.timestamp ? new Date(b.timestamp) : (b.date ? new Date(b.date) : new Date()),
        description: b.description || '',
        compteSource: b.accountNumber || b.sourceAccount || b.compteSource || '',
        compteDestination: b.targetAccountNumber || b.destinationAccount || b.compteDestination || '',
        statut: (b.status || b.statut || 'SUCCESS').toUpperCase() as any
    };
}
