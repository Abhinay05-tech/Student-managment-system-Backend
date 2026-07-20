import mongoose, { Schema } from "mongoose";

const sclassSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true,
    },
    school: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admin'
    },
},
{ 
    timestamps: true 
}
);

export const sclass = mongoose.model("sclass", classSchema);
