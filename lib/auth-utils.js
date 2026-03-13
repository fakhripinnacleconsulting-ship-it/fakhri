import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Validates if the current session has the required roles.
 * @param {string[]} requiredRoles - List of roles that are allowed.
 * @throws {Error} - If unauthorized or role not allowed.
 * @returns {Promise<object>} - The user session object.
 */
export async function validateRole(requiredRoles = []) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        throw new Error("Unauthorized: Please login to continue.");
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(session.user.role)) {
        throw new Error("Forbidden: You do not have permission to perform this action.");
    }

    return session.user;
}

/**
 * Returns true if the user is a super-admin.
 */
export async function isSuperAdmin() {
    try {
        await validateRole(['super-admin']);
        return true;
    } catch {
        return false;
    }
}

/**
 * Returns true if the user is an admin or super-admin.
 */
export async function isAdmin() {
    try {
        await validateRole(['admin', 'super-admin']);
        return true;
    } catch {
        return false;
    }
}
