import { type NextRequest, NextResponse } from "next/server";

// Interface pour le profil utilisateur
interface UserProfile {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	position: string;
	department: string;
}

// Données mockées
const mockProfile: UserProfile = {
	firstName: "Jean",
	lastName: "Dubois",
	email: "jean.dubois@topsteel.tech",
	phone: "01 23 45 67 89",
	position: "Responsable Production",
	department: "Production",
};

// Stockage temporaire
let userProfile = { ...mockProfile };

export async function GET(request: NextRequest) {
	try {
		await new Promise((resolve) => setTimeout(resolve, 100));
		return NextResponse.json(userProfile);
	} catch (error) {
		console.error("Error fetching user profile:", error);
		return NextResponse.json(
			{ error: "Failed to fetch user profile" },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const updates = await request.json();

		userProfile = {
			...userProfile,
			...updates,
		};

		await new Promise((resolve) => setTimeout(resolve, 200));

		return NextResponse.json(userProfile);
	} catch (error) {
		console.error("Error updating user profile:", error);
		return NextResponse.json(
			{ error: "Failed to update user profile" },
			{ status: 500 },
		);
	}
}
