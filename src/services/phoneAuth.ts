/**
 * Firebase Phone Authentication Service
 * =====================================
 * Handles OTP verification via SMS using Firebase's built-in phone auth.
 * 
 * Features:
 * - OTP sent via SMS automatically by Firebase
 * - reCAPTCHA verification for security
 * - No manual OTP generation
 * - Free tier compatible
 * - Production-ready
 */

import {
    RecaptchaVerifier,
    signInWithPhoneNumber,
    PhoneAuthProvider,
    linkWithCredential
} from 'firebase/auth';
import type { ConfirmationResult, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';

// Store confirmation result for OTP verification
let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialize reCAPTCHA verifier for phone authentication
 * Must be called before sending OTP
 * 
 * @param containerId - ID of the container element for reCAPTCHA
 * @param invisible - Whether to use invisible reCAPTCHA (default: true)
 */
export const initializeRecaptcha = (
    containerId: string = 'recaptcha-container',
    invisible: boolean = true
): RecaptchaVerifier => {
    // Clear existing verifier
    if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
    }

    // Create new recaptcha verifier
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: invisible ? 'invisible' : 'normal',
        callback: () => {
            console.log('✅ reCAPTCHA verified');
        },
        'expired-callback': () => {
            console.log('⚠️ reCAPTCHA expired, please try again');
        }
    });

    return recaptchaVerifier;
};

/**
 * Format phone number to E.164 format (required by Firebase)
 * Handles Indian numbers with or without country code
 * 
 * @param phone - Phone number (can be 10 digits or with +91)
 * @returns Formatted phone number (+91XXXXXXXXXX)
 */
export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Handle different input formats
    if (cleaned.startsWith('+91')) {
        return cleaned; // Already in correct format
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
        return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
        return '+91' + cleaned.substring(1);
    } else if (cleaned.length === 10) {
        return '+91' + cleaned;
    }

    return cleaned;
};

/**
 * Validate phone number format
 * 
 * @param phone - Phone number to validate
 * @returns Boolean indicating if phone is valid
 */
export const isValidPhoneNumber = (phone: string): boolean => {
    const formatted = formatPhoneNumber(phone);
    // Indian mobile numbers: +91 followed by 10 digits starting with 6-9
    const indianMobileRegex = /^\+91[6-9]\d{9}$/;
    return indianMobileRegex.test(formatted);
};

/**
 * Send OTP to the given phone number
 * Firebase handles OTP generation and SMS delivery
 * 
 * @param phoneNumber - Phone number to send OTP to
 * @returns Promise resolving to success status
 */
export const sendOTP = async (phoneNumber: string): Promise<{
    success: boolean;
    message: string;
    error?: string;
}> => {
    try {
        // Validate phone number
        const formattedPhone = formatPhoneNumber(phoneNumber);

        if (!isValidPhoneNumber(formattedPhone)) {
            return {
                success: false,
                message: 'Invalid phone number',
                error: 'Please enter a valid 10-digit mobile number'
            };
        }

        // Ensure reCAPTCHA is initialized
        if (!recaptchaVerifier) {
            initializeRecaptcha();
        }

        console.log(`📱 Sending OTP to ${formattedPhone}`);

        // Send OTP via Firebase (automatically sends SMS)
        confirmationResult = await signInWithPhoneNumber(
            auth,
            formattedPhone,
            recaptchaVerifier!
        );

        console.log('✅ OTP sent successfully');

        return {
            success: true,
            message: `OTP sent to ${formattedPhone}`
        };

    } catch (error: any) {
        console.error('❌ Error sending OTP:', error);

        // Handle specific error codes
        let errorMessage = 'Failed to send OTP. Please try again.';

        switch (error.code) {
            case 'auth/invalid-phone-number':
                errorMessage = 'Invalid phone number format';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many attempts. Please try again later.';
                break;
            case 'auth/quota-exceeded':
                errorMessage = 'SMS quota exceeded. Please try again tomorrow.';
                break;
            case 'auth/captcha-check-failed':
                errorMessage = 'reCAPTCHA verification failed. Please refresh and try again.';
                break;
            case 'auth/missing-phone-number':
                errorMessage = 'Please enter a phone number';
                break;
            default:
                errorMessage = error.message || 'Failed to send OTP';
        }

        // Reset reCAPTCHA on error
        if (recaptchaVerifier) {
            recaptchaVerifier.clear();
            recaptchaVerifier = null;
        }

        return {
            success: false,
            message: 'Failed to send OTP',
            error: errorMessage
        };
    }
};

/**
 * Verify the OTP entered by user
 * Firebase validates the OTP automatically
 * 
 * @param otp - 6-digit OTP entered by user
 * @returns Promise resolving to verification result
 */
export const verifyOTP = async (otp: string): Promise<{
    success: boolean;
    message: string;
    user?: User;
    isNewUser?: boolean;
    error?: string;
}> => {
    try {
        // Validate OTP format
        if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
            return {
                success: false,
                message: 'Invalid OTP',
                error: 'Please enter a valid 6-digit OTP'
            };
        }

        // Check if we have a pending confirmation
        if (!confirmationResult) {
            return {
                success: false,
                message: 'Session expired',
                error: 'Please request a new OTP'
            };
        }

        console.log('🔐 Verifying OTP...');

        // Verify OTP with Firebase
        const result = await confirmationResult.confirm(otp);
        const user = result.user;

        // Check if this is a new user
        const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;

        console.log('✅ OTP verified successfully');
        console.log(`   User UID: ${user.uid}`);
        console.log(`   Phone: ${user.phoneNumber}`);
        console.log(`   New User: ${isNewUser}`);

        // Clear confirmation result
        confirmationResult = null;

        return {
            success: true,
            message: 'OTP verified successfully!',
            user: user,
            isNewUser: isNewUser
        };

    } catch (error: any) {
        console.error('❌ Error verifying OTP:', error);

        let errorMessage = 'Invalid OTP. Please try again.';

        switch (error.code) {
            case 'auth/invalid-verification-code':
                errorMessage = 'Invalid OTP. Please check and try again.';
                break;
            case 'auth/code-expired':
                errorMessage = 'OTP has expired. Please request a new one.';
                break;
            case 'auth/session-expired':
                errorMessage = 'Session expired. Please request a new OTP.';
                break;
            default:
                errorMessage = error.message || 'Verification failed';
        }

        return {
            success: false,
            message: 'Verification failed',
            error: errorMessage
        };
    }
};

/**
 * Resend OTP to the same phone number
 * Requires a new reCAPTCHA verification
 * 
 * @param phoneNumber - Phone number to resend OTP to
 */
export const resendOTP = async (phoneNumber: string) => {
    // Clear existing verifier and create new one
    if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
    }

    // Re-initialize and send
    initializeRecaptcha();
    return sendOTP(phoneNumber);
};

/**
 * Link phone number to existing account
 * Useful when user signed in with other methods first
 * 
 * @param phoneNumber - Phone number to link
 */
export const linkPhoneNumber = async (phoneNumber: string): Promise<{
    success: boolean;
    message: string;
    error?: string;
}> => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return {
                success: false,
                message: 'Not signed in',
                error: 'Please sign in first'
            };
        }

        // Initialize reCAPTCHA if needed
        if (!recaptchaVerifier) {
            initializeRecaptcha();
        }

        const formattedPhone = formatPhoneNumber(phoneNumber);

        // Get phone credential
        const provider = new PhoneAuthProvider(auth);
        const verificationId = await provider.verifyPhoneNumber(
            formattedPhone,
            recaptchaVerifier!
        );

        // Store for later verification
        (window as any).__verificationId = verificationId;

        return {
            success: true,
            message: 'OTP sent for phone linking'
        };

    } catch (error: any) {
        console.error('Error linking phone:', error);
        return {
            success: false,
            message: 'Failed to link phone',
            error: error.message
        };
    }
};

/**
 * Complete phone linking with OTP
 */
export const completePhoneLinking = async (otp: string): Promise<{
    success: boolean;
    message: string;
    error?: string;
}> => {
    try {
        const verificationId = (window as any).__verificationId;
        const currentUser = auth.currentUser;

        if (!verificationId || !currentUser) {
            return {
                success: false,
                message: 'Session expired',
                error: 'Please start again'
            };
        }

        const credential = PhoneAuthProvider.credential(verificationId, otp);
        await linkWithCredential(currentUser, credential);

        return {
            success: true,
            message: 'Phone number linked successfully'
        };

    } catch (error: any) {
        console.error('Error completing phone link:', error);
        return {
            success: false,
            message: 'Failed to link phone',
            error: error.message
        };
    }
};

/**
 * Clear reCAPTCHA verifier (for cleanup)
 */
export const clearRecaptcha = () => {
    if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
    }
    confirmationResult = null;
};

/**
 * Get current authentication state
 */
export const getAuthState = () => {
    return {
        isAuthenticated: !!auth.currentUser,
        user: auth.currentUser,
        phoneNumber: auth.currentUser?.phoneNumber || null
    };
};

export default {
    initializeRecaptcha,
    formatPhoneNumber,
    isValidPhoneNumber,
    sendOTP,
    verifyOTP,
    resendOTP,
    linkPhoneNumber,
    completePhoneLinking,
    clearRecaptcha,
    getAuthState
};
