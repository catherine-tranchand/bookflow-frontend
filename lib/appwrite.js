// This file contains the Appwrite configuration and functions for user authentication and database operations.
// Import necessary modules from Appwrite SDK

import { Query } from 'react-native-appwrite'; // ✅ fix: was from 'appwrite'
import { Client, Account, ID, Databases, Avatars, Storage } from 'react-native-appwrite';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export const config = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: '67c721280013e7517446',
    databaseId: '67cadd810021c1570d2e',
    usersCollectionId: '67caddd5001d9e57dc48',
    booksCollectionId: '67caf8d5002e38a2518a',
    storageId: '67d18ae8001e30162f31'
};

const { endpoint, projectId, databaseId, usersCollectionId, booksCollectionId, storageId } = config;

const client = new Client();
client.setEndpoint(endpoint).setProject(projectId);

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client); // ✅ fix: storage n'était pas initialisé

// ─── createUser ───────────────────────────────────────────────────────────────
export const createUser = async (email, password, username, city, language, genres) => {
    try {
        try {
            await account.deleteSessions(); // ✅ fix: était deleteSession('current')
        } catch (e) {
            // pas de session active, on continue
        }

        const newAccount = await account.create(ID.unique(), email, password, username);
        if (!newAccount) throw new Error("User creation failed");

        await signIn(email, password);

        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FF9C01&color=161622&size=100`;

        const newUser = await databases.createDocument(
            databaseId,
            usersCollectionId,
            ID.unique(),
            {
                accountId: newAccount.$id,
                email,
                username,
                avatar: avatarUrl,
                city: city || null,
                language: language || null,
                genres: genres || null
            }
        );

        return newUser;

    } catch (error) {
        console.log("❌ Error creating user:", error.message);
        throw new Error(error.message);
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
        await account.deleteSessions(); // ✅ fix: était deleteSession('current')
        return true;
    } catch (error) {
        console.log("Logout error:", error.message);
        return false;
    }
};

// ─── getCurrentUser ───────────────────────────────────────────────────────────
export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        if (!currentAccount) throw new Error("No Appwrite session");

        const currentUser = await databases.listDocuments(
            databaseId,
            usersCollectionId,
            [Query.equal("accountId", currentAccount.$id)]
        );

        if (currentUser.documents.length > 0) {
            return currentUser.documents[0];
        }

        return {
            $id: currentAccount.$id,
            email: currentAccount.email,
            username: currentAccount.name || "Unknown",
            fallback: true
        };
    } catch (error) {
        console.log("Error in getCurrentUser:", error.message);
        return null;
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
        const books = await databases.listDocuments(databaseId, booksCollectionId); // ✅ fix: supprimé les mauvais arguments
        return books.documents;
    } catch (error) {
        console.log("Error fetching books:", error.message);
        throw new Error(error.message);
    }
};

// ─── addBook ──────────────────────────────────────────────────────────────────
export const addBook = async ({ title, author, description, image, creator }) => {
    try {
        const book = await databases.createDocument(
            databaseId,
            booksCollectionId,
            ID.unique(),
            { title, author, description, image, creator }
        );
        return book; // ✅ fix: était 'newBook' (variable inexistante)
    } catch (error) {
        console.log("Error adding book:", error.message);
        throw new Error(error.message);
    }
};


export const uploadImage = async () => {
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (result.canceled) throw new Error('Image picking cancelled');

        const pickedImage = result.assets[0];
        const fileUri = Platform.OS === 'ios' ? pickedImage.uri.replace('file://', '') : pickedImage.uri;
        const fileName = fileUri.split('/').pop();

        const file = {
            uri: pickedImage.uri,
            name: fileName,
            type: pickedImage.type || 'image/jpeg',
        };

        const uploadedFile = await storage.createFile(storageId, ID.unique(), file); // ✅ fix: storage maintenant initialisé

        const imageUrl = `https://cloud.appwrite.io/v1/storage/buckets/${storageId}/files/${uploadedFile.$id}/preview?project=${projectId}`;

        return imageUrl;

    } catch (error) {
        console.error('Error uploading image:', error.message);
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