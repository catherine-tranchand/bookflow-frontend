import { Query } from 'react-native-appwrite';
import { Client, Account, ID, Databases, Avatars, Storage } from 'react-native-appwrite';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export const config = {
    endpoint: 'https://fra.cloud.appwrite.io/v1',
    projectId: '69c3be5e002c7ebfd6ab',
    databaseId: '69c3f2cf00040f49c9f6',
    usersCollectionId: 'users',
    booksCollectionId: 'books',
    storageId: '69c40b120033b3f9b94f'
};

const { endpoint, projectId, databaseId, usersCollectionId, booksCollectionId, storageId } = config;

const client = new Client();
client.setEndpoint(endpoint).setProject(projectId);

export const account = new Account(client);
export const avatars = new Avatars(client);
export const databases = new Databases(client);
export const storage = new Storage(client);




// ─── createUser ───────────────────────────────────────────────────────────────
// CHANGEMENTS :
//   - ID du document = newAccount.$id  (plus besoin d'attribut "accountId")
//   - Suppression du champ accountId dans le document
export const createUser = async (email, password, username, city, language, genres) => {
    try {
        try {
            await account.deleteSessions();
        } catch (e) {
            // no active session, continue
        }

        const newAccount = await account.create(ID.unique(), email, password, username);
        if (!newAccount) throw new Error("User creation failed");

        await signIn(email, password);

        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FF9C01&color=161622&size=100`;

        const newUser = await databases.createDocument(
            databaseId,
            usersCollectionId,
            newAccount.$id,      // ← $id du document = $id du compte Auth
            {
                // ← pas de champ accountId
                email,
                username,
                avatar: avatarUrl,
                city: city || null,
                language: language || null,
                genres: genres || [],
            }
        );

        return newUser;

    } catch (error) {
        console.log("❌ Error creating user:", error.message);
        throw new Error(error.message);
    }
};

// ─── getCurrentUser ───────────────────────────────────────────────────────────
// CHANGEMENTS :
//   - getDocument(currentAccount.$id) au lieu de listDocuments + Query.equal("accountId")
export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        if (!currentAccount) throw new Error("No Appwrite session");

        const currentUser = await databases.getDocument(
            databaseId,
            usersCollectionId,
            currentAccount.$id   // ← fetch direct par $id, pas de Query
        );

        return currentUser;

    } catch (error) {
        console.log("Error in getCurrentUser:", error.message);
        return null;
    }
};

// ─── signIn ───────────────────────────────────────────────────────────────────
export const signIn = async (email, password) => {
    try {
        const session = await account.createEmailPasswordSession(email, password);
        return session;
    } catch (error) {
        console.log("Error signing in:", error.message);
        throw new Error(error.message);
    }
};

// ─── logout ───────────────────────────────────────────────────────────────────
export const logout = async () => {
    try {
        await account.deleteSessions();
        return true;
    } catch (error) {
        console.log("Logout error:", error.message);
        return false;
    }
};



// ─── getAllUsers ──────────────────────────────────────────────────────────────
export const getAllUsers = async () => {
    try {
        const users = await databases.listDocuments(databaseId, usersCollectionId);
        return users.documents;
    } catch (error) {
        console.error("Error fetching users:", error.message);
        throw new Error(error.message);
    }
};

// ─── getAllBooks ──────────────────────────────────────────────────────────────
export const getAllBooks = async () => {
    try {
        const books = await databases.listDocuments(
            databaseId,
            booksCollectionId
        );
        return books.documents;
    } catch (error) {
        console.log("Error fetching books:", error.message);
        throw new Error(error.message);
    }
};

// ─── addBook ──────────────────────────────────────────────────────────────────
export const addBook = async ({ title, author, description, image, creator, genre, state, type, city }) => {
    try {
        console.log("📦 addBook payload:", { title, author, description, image, creator, genre, state, type, city });
        const book = await databases.createDocument(
            databaseId,
            booksCollectionId,
            ID.unique(),
            { title, author, description, image, creator, genre, state, type, city }
        );
        return book;
    } catch (error) {
        console.log("Error adding book:", error.message);
        throw new Error(error.message);
    }
};


export const uploadImage = async (uri) => {
    try {
        const fileName = uri.split('/').pop();
        
        const file = {
            uri,
            name: fileName,
            type: 'image/jpeg',
            size: 500000,
        };

        const uploadedFile = await storage.createFile(
            storageId,
            ID.unique(),
            file
        );

        const imageUrl = `https://fra.cloud.appwrite.io/v1/storage/buckets/${storageId}/files/${uploadedFile.$id}/view?project=${projectId}`;
        return imageUrl;

    } catch (error) {
        console.error('Error uploading image:', error.message);
        throw new Error(error.message);
    }
};

// ─── updateBook ──────────────────────────────────────────────────────────────────

export const updateBook = async (bookId, { title, author, description, image, genre, state, type }) => {
    try {
        const updated = await databases.updateDocument(
            databaseId,
            booksCollectionId,
            bookId,
            { title, author, description, image, genre, state, type }
        );
        return updated;
    } catch (error) {
        console.log("Error updating book:", error.message);
        throw new Error(error.message);
    }
};

export const deleteBook = async (bookId) => {
    try {
        await databases.deleteDocument(databaseId, booksCollectionId, bookId);
        return true;
    } catch (error) {
        console.log("Error deleting book:", error.message);
        throw new Error(error.message);
    }
};

// ─── updateUser ──────────────────────────────────────────────────────────────
export const updateUser = async (userId, { bio, wishlist, genres }) => {
    try {
        const updated = await databases.updateDocument(
            databaseId,
            usersCollectionId,
            userId,
            {
                bio: bio || null,
                wishlist: wishlist || null,
                genres: genres || null,
            }
        );
        return updated;
    } catch (error) {
        console.log("Error updating user:", error.message);
        throw new Error(error.message);
    }
};

export const getUserBooks = async (userId) => {
    try {
        const books = await databases.listDocuments(
            databaseId,
            booksCollectionId,
            [Query.equal("creator", userId)]
        );
        return books.documents;
    } catch (error) {
        console.log("Error fetching user books:", error.message);
        throw new Error(error.message);
    }
};

