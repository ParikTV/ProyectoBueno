// src/components/CategoryCard.tsx

import { Card, CardActionArea, Typography } from '@mui/material';
import { motion, Variants } from 'framer-motion'; // Se importa 'Variants' para tipado explícito
import { Category } from '../types';
import { iconMap } from './Icons'; // FIX: Se importa iconMap en lugar de getIcon

interface CategoryCardProps {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
}

// FIX: Se añade el tipo 'Variants' para resolver el error de tipado de Framer Motion
const cardVariants: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
  hover: { scale: 1.05, transition: { type: "spring", stiffness: 300, damping: 15 } },
};

const CategoryCard = ({ category, isSelected, onClick }: CategoryCardProps) => {
  // FIX: Se busca el ícono usando el nombre de la categoría, ya que 'icon_name' no existe.
  // Se convierte a minúsculas y se usa la primera palabra como clave para más flexibilidad.
  const iconKey = category.name.toLowerCase().split(' ')[0];
  const Icon = iconMap[iconKey] || iconMap.default;

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      style={{ height: '100%' }} // Asegura que el div de motion ocupe toda la altura
    >
      <Card
        sx={{
          height: '100%',
          border: 2,
          borderColor: isSelected ? 'primary.main' : 'transparent',
          boxShadow: isSelected ? '0 0 15px rgba(33, 150, 243, 0.5)' : '0 4px 12px rgba(0,0,0,0.08)',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          borderRadius: '16px', // Bordes más redondeados
        }}
        onClick={onClick}
      >
        <CardActionArea sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Icon sx={{ fontSize: 48, color: 'primary.main', mb: 1.5 }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: '600' }}>
            {category.name}
          </Typography>
        </CardActionArea>
      </Card>
    </motion.div>
  );
};

export default CategoryCard;