"use server"
import { ID, Query } from "node-appwrite"
import { BUCKET_ID, DATABASE_ID, databases, ENDPOINT, PATIENT_COLLECTION_ID, PROJECT_ID, storage, users } from "../appwrite.config"
import { parseStringify } from "../utils"
import { InputFile } from 'node-appwrite/file'

export const createUser = async(user:CreateUserParams) => {
    
    
    try {
        const newUser = await users.create(
            ID.unique(),
            user.email,
            user.phone,
            undefined,
            user.name
        )

        console.log({newUser});
        return newUser;
    } catch (error:any) {
        if( error && error?.code === 409){
            const existingUser = await users.list([
                Query.equal('email', [user.email])
            ])

            return existingUser?.users[0];
        }
        console.error(" An error occured while creating a new user: ",  error);
        
    }
}

export const getUser = async(userId:string) => {
    try {
        const user = await users.get(userId);
        return parseStringify(user);
    } catch (error) {
        console.log(error);
        
    }
}

export const registerPatient = async ({identificationDocument, ...patient}:RegisterUserParams) => {
    console.log("identificationDocument: " ,identificationDocument);
    
    try {
        let file;

        if( identificationDocument ){
            // const inputFile = InputFile.fromBuffer(
            //     identificationDocument?.get('blobFile') as Blob,
            //     identificationDocument?.get('fileName') as string,
            // )

            const blobFile = identificationDocument.get('blobFile');
            const fileName = identificationDocument.get('fileName');


            if( blobFile && fileName ){
                const inputFile = InputFile.fromBuffer(
                    blobFile as Blob,
                    fileName as string,
                );
                console.log("Input File: ", inputFile);
                

                file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);
                console.log("file", file); 
            }
            else{
                throw new Error("Invalid blobFile or fileName");
            }
            
            
          
            

        }

        const newPatient = await databases.createDocument(
            DATABASE_ID!,
            PATIENT_COLLECTION_ID!,
            ID.unique(),
            {
                identificationDocumentId: file?.$id || null,
                identificationDocumentUrl:`${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file?.$id}/view?project=${PROJECT_ID}`,
                ...patient
            }
        )

        return parseStringify(newPatient);
    } catch (error) {
        console.log("register Patient error: ", error);        
    }
}



