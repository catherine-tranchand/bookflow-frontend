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
}

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
export const createUser = async (email, password, username) => {
    try {
        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username
        );

        if (!newAccount) throw new Error("User creation failed");

        // Generate avatar based on initials
        const avatarUrl = avatars.getInitials(username);

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
// Get User function
export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();

        if(!currentAccount) throw Error;

        const currentUser= await databases.listDocuments (
            config.databaseId,
            config.usersCollectionId, 
            [Query.equal('accountId', currentAccount.$id)]
        )
        if(!currentUser) throw Error;

        return currentUser.documents[0]; // Return one user
    
        } catch (error) {
            console.log(error);
        }
    }
       export const getAllBooks = async () => {
        try {

            const books = await databases.listDocuments(
                databaseId,
                booksCollectionId
            )
            return books.documents;

        } catch (error) {
            throw new Error(error);
        }
        }
    

    


