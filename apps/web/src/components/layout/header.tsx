"use client";

import { NotificationCenter } from "@/components/notifications/notification-center";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@erp/ui";
import {
	Building2,
	ChevronDown,
	LogOut,
	Search,
	Settings,
	User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface HeaderProps {
	onToggleSidebar?: () => void;
	isSidebarCollapsed?: boolean;
}

export function Header({
	onToggleSidebar,
	isSidebarCollapsed = false,
}: HeaderProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [showUserMenu, setShowUserMenu] = useState(false);
	const { user, logout } = useAuth();
	const { t } = useTranslation("common");
	const router = useRouter();
	const menuRef = useRef<HTMLDivElement>(null);

	// Fermer le menu si on clique à l'extérieur
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setShowUserMenu(false);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleLogout = async () => {
		try {
			await logout();
			router.push("/login");
		} catch (error) {
			console.error("Erreur lors de la déconnexion:", error);
		}
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6 py-3 shadow-sm">
			<div className="flex items-center justify-between">
				{/* Section gauche - Logo */}
				<div className="flex items-center space-x-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
						<Building2 className="h-5 w-5" />
					</div>
					<div className="hidden md:block">
						<h1 className="text-xl font-bold text-foreground">TopSteel</h1>
						<p className="text-xs text-muted-foreground">ERP Métallerie</p>
					</div>
				</div>

				{/* Section centre - Recherche */}
				<div className="flex-1 max-w-md mx-6">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<input
							type="text"
							placeholder={t("search")}
							value={searchQuery}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
								setSearchQuery(e.target.value)
							}
							className="w-full pl-10 pr-4 py-2 bg-muted border border-input rounded-lg text-foreground placeholder-muted-foreground focus:bg-background focus:ring-2 focus:ring-ring focus:outline-none transition-all"
						/>
					</div>
				</div>

				{/* Section droite - Actions utilisateur */}
				<div className="flex items-center space-x-2">
					{/* Notifications */}
					<NotificationCenter />

					{/* Menu utilisateur */}
					<div className="relative" ref={menuRef}>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowUserMenu(!showUserMenu)}
							className="flex items-center space-x-2 text-muted-foreground hover:text-foreground hover:bg-accent"
						>
							<div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
								{user?.profile?.acronyme ||
									user?.nom?.[0] ||
									user?.email?.[0] ||
									"U"}
							</div>
							<span className="hidden md:block text-sm font-medium">
								{user?.profile?.acronyme
									? `${user?.profile?.prenom || user?.prenom || ""} ${user?.profile?.nom || user?.nom || ""}`.trim() ||
										user?.profile?.acronyme
									: user?.nom ||
										user?.email?.split("@")[0] ||
										t("user") ||
										"Utilisateur"}
							</span>
							<ChevronDown className="h-4 w-4" />
						</Button>

						{/* Menu déroulant */}
						{showUserMenu && (
							<div className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border py-1 z-50">
								{/* Info utilisateur */}
								<div className="px-4 py-3 border-b border-border">
									<p className="text-sm font-medium text-foreground">
										{user?.profile?.acronyme
											? `${user?.profile?.prenom || user?.prenom || ""} ${user?.profile?.nom || user?.nom || ""}`.trim() ||
												user?.profile?.acronyme
											: user?.nom ||
												user?.email?.split("@")[0] ||
												t("user") ||
												"Utilisateur"}
									</p>
									<p className="text-sm text-muted-foreground">
										{user?.profile?.acronyme &&
											`@${user?.profile?.acronyme} • `}
										{user?.email || "utilisateur@topsteel.tech"}
									</p>
									{user?.profile?.poste && (
										<p className="text-xs text-muted-foreground">
											{user?.profile?.poste} •{" "}
											{user?.profile?.departement || "TopSteel"}
										</p>
									)}
								</div>

								{/* Actions */}
								<div className="py-1">
									<button
										onClick={() => {
											router.push("/profile");
											setShowUserMenu(false);
										}}
										className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
									>
										<User className="h-4 w-4 mr-3" />
										{t("profile")}
									</button>

									<button
										onClick={() => {
											router.push("/settings");
											setShowUserMenu(false);
										}}
										className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
									>
										<Settings className="h-4 w-4 mr-3" />
										{t("settings")}
									</button>
								</div>

								<div className="border-t border-border py-1">
									<button
										onClick={handleLogout}
										className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
									>
										<LogOut className="h-4 w-4 mr-3" />
										{t("logout")}
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
