import mongoose from "mongoose"

const dbConnect = async ()=>{

    const mongoUri = process.env.MONGO_URL;

    try {
        const db = await mongoose.connect(mongoUri);
    } catch (error) {
        console.log(error);
    }
}

export default dbConnect;
