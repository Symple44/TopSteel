"use client";

import {
	Button,
	Card,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@erp/ui";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle,
	Clock,
	MessageCircle,
	Phone,
	Users
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

// Force dynamic rendering to avoid SSR issues
export const dynamic = "force-dynamic";

const SUPPORT_CATEGORIES = [
	{ value: "technical", label: "Problème technique", icon: AlertCircle },
	{ value: "account", label: "Gestion de compte", icon: Users },
	{ value: "billing", label: "Facturation", icon: MessageCircle },
	{ value: "feature", label: "Demande de fonctionnalité", icon: CheckCircle },
	{ value: "other", label: "Autre", icon: MessageCircle },
];

const URGENCY_LEVELS = [
	{ value: "low", label: "Faible - Demande générale", color: "text-green-600" },
	{
		value: "medium",
		label: "Moyenne - Impact sur le travail",
		color: "text-yellow-600",
	},
	{ value: "high", label: "Élevée - Blocage majeur", color: "text-orange-600" },
	{
		value: "critical",
		label: "Critique - Service inaccessible",
		color: "text-red-600",
	},
];

export default function SupportPage() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		company: "",
		category: "",
		urgency: "",
		subject: "",
		description: "",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validation basique
		if (
			!formData.name ||
			!formData.email ||
			!formData.subject ||
			!formData.description
		) {
			toast.error("Veuillez remplir tous les champs obligatoires");
			return;
		}

		setIsLoading(true);

		try {
			// Simuler l'envoi du ticket
			await new Promise((resolve) => setTimeout(resolve, 2000));

			setIsSubmitted(true);
			toast.success("Ticket créé - Votre demande a été envoyée avec succès");
		} catch (error) {
			toast.error("Une erreur est survenue. Veuillez réessayer.");
		} finally {
			setIsLoading(false);
		}
	};

	if (isSubmitted) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
				<div className="max-w-2xl mx-auto pt-8">
					<Card className="p-8 shadow-lg">
						<div className="text-center space-y-6">
							<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
								<CheckCircle className="h-8 w-8 text-green-600" />
							</div>

							<div className="space-y-2">
								<h1 className="text-2xl font-bold text-gray-900">
									Ticket créé avec succès
								</h1>
								<p className="text-gray-600">
									Votre demande a été enregistrée sous le numéro{" "}
									<strong>#TS-{Date.now().toString().slice(-6)}</strong>
								</p>
							</div>

							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
								<h3 className="font-medium text-blue-900 mb-2">
									Prochaines étapes :
								</h3>
								<ul className="text-sm text-blue-800 space-y-1">
									<li>• Vous recevrez un email de confirmation</li>
									<li>• Notre équipe vous contactera sous 24h</li>
									<li>• Suivez votre ticket via l'interface admin</li>
								</ul>
							</div>

							<div className="space-y-3">
								<Button
									onClick={() => setIsSubmitted(false)}
									className="w-full"
								>
									Créer un autre ticket
								</Button>

								<Link href="/dashboard">
									<Button variant="outline" className="w-full">
										Retour au tableau de bord
									</Button>
								</Link>
							</div>
						</div>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
			<div className="max-w-4xl mx-auto pt-8">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Support TopSteel
					</h1>
					<p className="text-gray-600">
						Notre équipe est là pour vous aider. Décrivez votre problème et nous
						vous contacterons rapidement.
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-6">
					{/* Contact rapide */}
					<div className="space-y-4">
						<Card className="p-6">
							<h3 className="font-semibold text-gray-900 mb-4 flex items-center">
								<Phone className="mr-2 h-5 w-5 text-blue-600" />
								Contact direct
							</h3>
							<div className="space-y-3 text-sm">
								<div>
									<p className="font-medium">Support technique</p>
									<p className="text-gray-600">+33 1 23 45 67 89</p>
									<p className="text-xs text-gray-500">Lun-Ven 9h-18h</p>
								</div>
								<div>
									<p className="font-medium">Email</p>
									<p className="text-gray-600">support@topsteel.tech</p>
									<p className="text-xs text-gray-500">Réponse sous 24h</p>
								</div>
							</div>
						</Card>

						<Card className="p-6">
							<h3 className="font-semibold text-gray-900 mb-4 flex items-center">
								<Clock className="mr-2 h-5 w-5 text-green-600" />
								Temps de réponse
							</h3>
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span>Critique</span>
									<span className="font-medium text-red-600">1h</span>
								</div>
								<div className="flex justify-between">
									<span>Élevée</span>
									<span className="font-medium text-orange-600">4h</span>
								</div>
								<div className="flex justify-between">
									<span>Moyenne</span>
									<span className="font-medium text-yellow-600">24h</span>
								</div>
								<div className="flex justify-between">
									<span>Faible</span>
									<span className="font-medium text-green-600">48h</span>
								</div>
							</div>
						</Card>
					</div>

					{/* Formulaire */}
					<div className="md:col-span-2">
						<Card className="p-6">
							<h2 className="text-xl font-semibold text-gray-900 mb-6">
								Créer un ticket de support
							</h2>

							<form onSubmit={handleSubmit} className="space-y-6">
								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="name">Nom complet *</Label>
										<Input
											id="name"
											value={formData.name}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												handleInputChange("name", e.target.value)
											}
											placeholder="Jean Dupont"
											required
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="email">Email *</Label>
										<Input
											id="email"
											type="email"
											value={formData.email}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												handleInputChange("email", e.target.value)
											}
											placeholder="jean.dupont@entreprise.com"
											required
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="company">Entreprise</Label>
									<Input
										id="company"
										value={formData.company}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											handleInputChange("company", e.target.value)
										}
										placeholder="TopSteel Métallerie"
									/>
								</div>

								<div className="grid md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="category">Catégorie *</Label>
										<Select
											value={formData.category}
											onValueChange={(value: string) =>
												handleInputChange("category", value)
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Sélectionnez une catégorie" />
											</SelectTrigger>
											<SelectContent>
												{SUPPORT_CATEGORIES.map((cat) => (
													<SelectItem key={cat.value} value={cat.value}>
														{cat.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="urgency">Urgence *</Label>
										<Select
											value={formData.urgency}
											onValueChange={(value: string) =>
												handleInputChange("urgency", value)
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Niveau d'urgence" />
											</SelectTrigger>
											<SelectContent>
												{URGENCY_LEVELS.map((level) => (
													<SelectItem key={level.value} value={level.value}>
														<span className={level.color}>{level.label}</span>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="subject">Sujet *</Label>
									<Input
										id="subject"
										value={formData.subject}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											handleInputChange("subject", e.target.value)
										}
										placeholder="Résumé du problème"
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="description">Description détaillée *</Label>
									<Textarea
										id="description"
										value={formData.description}
										onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
											handleInputChange("description", e.target.value)
										}
										placeholder="Décrivez votre problème en détail : étapes pour reproduire, messages d'erreur, capture d'écran..."
										rows={6}
										required
									/>
								</div>

								<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
									<p>
										<strong>Conseil :</strong> Plus vous nous donnez
										d'informations, plus nous pourrons vous aider rapidement.
										N'hésitez pas à inclure des captures d'écran ou des messages
										d'erreur.
									</p>
								</div>

								<div className="flex gap-3">
									<Button type="submit" disabled={isLoading} className="flex-1">
										{isLoading ? "Envoi en cours..." : "Envoyer le ticket"}
									</Button>

									<Link href="/login">
										<Button variant="outline">
											<ArrowLeft className="mr-2 h-4 w-4" />
											Retour
										</Button>
									</Link>
								</div>
							</form>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
