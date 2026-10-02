import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';

export const ROLES = ['student', 'alumni'];

const profileSchema = new Schema({
    profession: { type: String, trim: true },
    // field of study for students, field of expertise for alumni
    field: { type: String, trim: true },
    passingYear: { type: Number, min: 1950, max: 2100 },
    workplace: { type: String, trim: true },
    // skills for alumni, interests for students
    skills: { type: [String], default: [] },
    location: { type: String, trim: true },
    availability: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 1000 },
}, { _id: false });

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },

    phoneNo: {
        type: String,
        trim: true,
    },

    password: {
        type: String,
        required: true,
    },

    role: {
        type: String,
        enum: ROLES,
        required: true,
    },

    state: {
        type: String,
        trim: true,
    },

    district: {
        type: String,
        trim: true,
    },

    profile: {
        type: profileSchema,
        default: () => ({}),
    },

    isVerified: {
        type: Boolean,
        default: false,
    },

    refreshToken: {
        type: String
    },

    verifyToken: String,
    verifyTokenExpiry: Date,
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,

}, { timestamps: true });

//pre hooks allow us to do any operation before saving the data in database
//in pre hook the first parameter on which event you have to do the operation like save, validation, etc
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

//you can create your custom methods as well by using methods object
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

//jwt is a bearer token it means the person bear this token we give the access to that person its kind of chavi
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userName: this.userName,
            role: this.role,
        }, process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
}

// never send secrets or one-time tokens to a client
userSchema.set('toJSON', {
    transform: (_, ret) => {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.verifyToken;
        delete ret.verifyTokenExpiry;
        delete ret.forgotPasswordToken;
        delete ret.forgotPasswordTokenExpiry;
        delete ret.__v;
        return ret;
    }
});

export const User = mongoose.model("User", userSchema);
