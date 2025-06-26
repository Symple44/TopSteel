import * as React from "react"

interface ProjetCardProps {
  children?: React.ReactNode;
  className?: string;
  projet?: any;
  onClick?: () => void;
  key?: string;
}

export const ProjetCard: React.FC<ProjetCardProps> = ({ 
  children, 
  className, 
  projet, 
  onClick, 
  ...props 
}) => {
  return (
    <div className={className} onClick={onClick} {...props}>
      {projet ? (
        <div>
          <h3>{projet.nom}</h3>
          <p>{projet.description}</p>
        </div>
      ) : children}
    </div>
  )
}
