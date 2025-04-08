// This file contains the Appwrite configuration and functions for user authentication and database operations.
// Import necessary modules from Appwrite SDK

import { Query } from 'appwrite';
import { Client, Account, ID, Databases, Avatars } from 'react-native-appwrite';

export const config = {
    endpoint: 'https://cloud.appwrite.io/v1', // Your Appwrite Endpoint
    projectId: '67c721280013e7517446',
    databaseId: '67cadd810021c1570d2e',
    usersCollectionId: '67caddd5001d9e57dc48',
    booksCollectionId: '67caf8d5002e38a2518a',
    storageId: '67d18ae8001e30162f31'
};

const {
    endpoint,
    projectId,
    databaseId,
    usersCollectionId,
    booksCollectionId,
    storageId
} = config;

// Initialize the Appwrite SDK
const client = new Client();

client 
    .setEndpoint(endpoint) // Appwrite Endpoint
    .setProject(projectId); // project ID

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

// createUser Function
export const createUser = async (email, password, username, city, area, language) => {
    try {
        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username,
            city,
            area,  
            language
        );

        if (!newAccount) throw new Error("User creation failed");

        // Generate avatar based on initials
       const avatarUrl = avatars.getInitials(username);


        // Fallback for the avatar if it isn't generated correctly
        if (!avatarUrl) {
            console.log("Avatar not generated. Using default avatar.");
            avatarUrl = `https://cloud.appwrite.io/v1/avatars/initials?name=${encodeURIComponent(username)}`;
        }

        // Sign in the new user
        await signIn(email, password);

        // Store user details in the database
        const newUser = await databases.createDocument(
            databaseId,
            usersCollectionId,
            ID.unique(),
            {
                accountId: newAccount.$id,
                email,
                username,
                avatar: avatarUrl
            }
        );

        return newUser;

    } catch (error) {
        console.log("Error creating user:", error.message);
        throw new Error(error.message);
    }
};

// Sign In Function
export const signIn = async (email, password) => {
    try {
        const session = await account.createEmailPasswordSession(email, password);
        return session;
    } catch (error) {
        console.log("Error signing in:", error.message);
        throw new Error(error.message);
    }
};

// Get Current User Function (Updated to handle relationship fetch)
export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        if (!currentAccount) throw new Error("No Appwrite session");

        const currentUser = await databases.listDocuments(
            databaseId,
            usersCollectionId,
            [Query.equal("accountId", currentAccount.$id)]
        );

        // If user doc exists, return it; otherwise, return basic account info
        if (currentUser.documents.length > 0) {
            return currentUser.documents[0];
        }

        // Fallback: return account info only (useful for routing decisions)
        return {
            $id: currentAccount.$id,
            email: currentAccount.email,
            username: currentAccount.name || "Unknown",
            fallback: true // optional flag so you know it’s partial
        };
    } catch (error) {
        console.log("Error in getCurrentUser:", error.message);
        return null;
    }
};

// Function to get all users from the database
export const getAllUsers = async () => {
    try {
        const users = await databases.listDocuments(
            databaseId,
            usersCollectionId // The collection where user data is stored
        );
        return users.documents; // Return the array of user documents
    } catch (error) {
        console.error("Error fetching users:", error.message);
        throw new Error(error.message);
    }
};


// Fetch All Books and Expand `ownerId` Relationship
export const getAllBooks = async () => {
    try {
        // Fetch books and expand the `ownerId` relationship
        const books = await databases.listDocuments(
            databaseId,
            booksCollectionId,
            [],
            ['creator'] // Expanding the ownerId relationship to get user data
        );

        // Now, each book will have an expanded `ownerId` field, containing the user info
        return books.documents;

    } catch (error) {
        console.log("Error fetching books:", error.message);
        throw new Error(error.message);
    }
};



    


