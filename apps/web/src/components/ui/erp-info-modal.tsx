"use client";

import {
  type BackendHealthInfo,
  useBackendHealth,
} from "@/hooks/use-backend-health";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@erp/ui";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Code,
  Database,
  Globe,
  Server,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { createPortal } from "react-dom";

interface ErpInfoModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function ErpInfoModal({ isOpen, onClose }: ErpInfoModalProps) {
	const { health, checkHealth, isChecking } = useBackendHealth();
	const { t } = useTranslation("common");

	// Définir les fonctions utilitaires en premier
	const getStatusIcon = (status: BackendHealthInfo["status"]) => {
		switch (status) {
			case "online":
				return <CheckCircle className="h-5 w-5 text-emerald-500" />;
			case "offline":
				return <XCircle className="h-5 w-5 text-red-500" />;
			case "error":
				return <AlertCircle className="h-5 w-5 text-orange-500" />;
			case "checking":
				return <Clock className="h-5 w-5 text-gray-500 animate-spin" />;
			default:
				return <AlertCircle className="h-5 w-5 text-gray-500" />;
		}
	};

	const getStatusText = (status: BackendHealthInfo["status"]) => {
		switch (status) {
			case "online":
				return "En ligne";
			case "offline":
				return "Hors ligne";
			case "error":
				return "Erreur";
			case "checking":
				return "Vérification...";
			default:
				return "Inconnu";
		}
	};

	const getStatusColor = (status: BackendHealthInfo["status"]) => {
		switch (status) {
			case "online":
				return "text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/50";
			case "offline":
				return "text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-950/50";
			case "error":
				return "text-orange-600 bg-orange-50 dark:text-orange-300 dark:bg-orange-950/50";
			case "checking":
				return "text-muted-foreground bg-muted/50";
			default:
				return "text-muted-foreground bg-muted/50";
		}
	};

	if (!isOpen) return null;

	// Utiliser un portal pour rendre le modal au niveau racine du DOM
	const modalContent = (
		<div
			className="fixed inset-0 z-[99999] flex items-center justify-center"
			style={{ zIndex: 99999 }}
		>
			{/* Overlay */}
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-md"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-border">
					<div className="flex items-center gap-3">
						<div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
							<Server className="h-5 w-5 text-primary-foreground" />
						</div>
						<div>
							<h2 className="text-lg font-semibold text-foreground">
								TopSteel ERP
							</h2>
							<p className="text-sm text-muted-foreground">
								Informations système
							</p>
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="h-8 w-8 p-0"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* Status général */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-foreground">
								Statut du serveur
							</span>
							<Button
								variant="outline"
								size="sm"
								onClick={checkHealth}
								disabled={isChecking}
								className="h-7 px-3 text-xs"
							>
								{isChecking ? (
									<>
										<Clock className="h-3 w-3 mr-1 animate-spin" />
										Vérification...
									</>
								) : (
									"Actualiser"
								)}
							</Button>
						</div>

						<div
							className={cn(
								"flex items-center gap-3 p-3 rounded-lg border",
								getStatusColor(health.status),
							)}
						>
							{getStatusIcon(health.status)}
							<div className="flex-1">
								<p className="text-sm font-medium">
									{getStatusText(health.status)}
								</p>
								{health.responseTime && (
									<p className="text-xs opacity-75">
										Temps de réponse: {health.responseTime}ms
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Informations détaillées */}
					<div className="space-y-3">
						<h3 className="text-sm font-medium text-foreground">
							Informations détaillées
						</h3>

						<div className="grid gap-3">
							{/* Version */}
							<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
								<div className="flex items-center gap-2">
									<Code className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm text-foreground">Version</span>
								</div>
								<span className="text-sm font-mono text-muted-foreground">
									{health.version || "N/A"}
								</span>
							</div>

							{/* Environnement */}
							<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
								<div className="flex items-center gap-2">
									<Globe className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm text-foreground">Environnement</span>
								</div>
								<span
									className={cn(
										"text-sm font-medium px-2 py-1 rounded-md",
										health.environment === "production"
											? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
											: health.environment === "development"
												? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
												: "bg-muted text-muted-foreground",
									)}
								>
									{health.environment || "N/A"}
								</span>
							</div>

							{/* Database */}
							<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
								<div className="flex items-center gap-2">
									<Database className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm text-foreground">
										Base de données
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div
										className={cn(
											"h-2 w-2 rounded-full",
											health.database === "connected"
												? "bg-emerald-500"
												: health.database === "disconnected"
													? "bg-red-500"
													: "bg-gray-500",
										)}
									/>
									<span className="text-sm text-muted-foreground">
										{health.database === "connected"
											? "Connectée"
											: health.database === "disconnected"
												? "Déconnectée"
												: "Inconnue"}
									</span>
								</div>
							</div>

							{/* Utilisateurs connectés */}
							<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm text-foreground">
										Utilisateurs connectés
									</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
									<span className="text-sm font-mono text-muted-foreground">
										{health.activeUsers !== null ? health.activeUsers : 'N/A'}
									</span>
								</div>
							</div>

							{/* Uptime */}
							{health.uptime && (
								<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
									<div className="flex items-center gap-2">
										<Clock className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm text-foreground">
											Temps de fonctionnement
										</span>
									</div>
									<span className="text-sm font-mono text-muted-foreground">
										{health.uptime}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* Dernière vérification */}
					{health.lastCheck && (
						<div className="text-center text-xs text-muted-foreground">
							Dernière vérification:{" "}
							{health.lastCheck.toLocaleTimeString("fr-FR")}
						</div>
					)}

					{/* Message d'erreur */}
					{health.error && (
						<div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
							<p className="text-sm text-red-700 dark:text-red-300 font-medium">Erreur:</p>
							<p className="text-sm text-red-600 dark:text-red-400 mt-1">{health.error}</p>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-6 py-4 bg-muted/30 border-t border-border">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>TopSteel© ERP</span>
						<span>Solide comme votre savoir-faire</span>
					</div>
				</div>
			</div>
		</div>
	);

	// Rendre le modal dans un portal pour qu'il soit au centre de l'écran
	return typeof window !== "undefined"
		? createPortal(modalContent, document.body)
		: null;
}
