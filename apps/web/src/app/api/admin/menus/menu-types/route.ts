import { NextResponse } from 'next/server'

export async function GET() {
  // Types de menu statiques basés sur le système TopSteel
  const menuTypes = [
    {
      id: 'M',
      name: 'Dossier',
      description: "Conteneur pour organiser d'autres éléments de menu",
      icon: 'Folder',
      allowsChildren: true,
      hasUrl: false,
    },
    {
      id: 'P',
      name: 'Programme',
      description: "Page ou fonctionnalité de l'application",
      icon: 'FileText',
      allowsChildren: false,
      hasUrl: true,
      urlField: 'programId',
    },
    {
      id: 'L',
      name: 'Lien externe',
      description: 'Lien vers un site web externe',
      icon: 'ExternalLink',
      allowsChildren: false,
      hasUrl: true,
      urlField: 'externalUrl',
    },
    {
      id: 'D',
      name: 'Vue Data',
      description: 'Vue de données générée par Query Builder',
      icon: 'Database',
      allowsChildren: false,
      hasUrl: true,
      urlField: 'queryBuilderId',
    },
  ]

  return NextResponse?.json({
    success: true,
    data: {
      types: menuTypes,
    },
  })
}
