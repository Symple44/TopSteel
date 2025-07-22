'use client'

export const dynamic = 'force-dynamic'

export default function LoginPageSimple() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-6">TopSteel ERP</h1>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="admin@topsteel.tech"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input 
              type="password" 
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="TopSteel44!"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Se connecter
          </button>
        </form>
        <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm">
          <div className="font-medium">Compte démo :</div>
          <div>Email: admin@topsteel.tech</div>
          <div>Mot de passe: TopSteel44!</div>
        </div>
      </div>
    </div>
  )
}