// src/pages/HomePage.tsx

import React, { useState, useEffect } from 'react';
import { Typography, Box, TextField, Button, Paper, InputAdornment, CircularProgress } from '@mui/material';
import { Search as SearchIcon, LocationOn as LocationOnIcon } from '@mui/icons-material';
import { motion, AnimatePresence, Variants } from 'framer-motion';

import CategoryCard from '../components/CategoryCard';
import ListingCard from '../components/ListingCard';
import { Business, Category } from '../types';
import { API_BASE_URL } from '../services/api';
import { ExtendedPage } from '../App';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};
const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

interface HomePageProps {
    navigateTo: (page: ExtendedPage, businessId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigateTo }) => {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [businessesResponse, categoriesResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/businesses/`),
                    fetch(`${API_BASE_URL}/categories/`)
                ]);
                if (!businessesResponse.ok) throw new Error('No se pudieron cargar los negocios.');
                if (!categoriesResponse.ok) throw new Error('No se pudieron cargar las categorías.');
                
                const businessesData = await businessesResponse.json();
                const categoriesData = await categoriesResponse.json();

                setBusinesses(businessesData);
                setCategories(categoriesData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleSelectCategory = (categoryName: string) => {
        setSelectedCategory(prev => (prev === categoryName ? null : categoryName));
    };

    const filteredBusinesses = selectedCategory
        ? businesses.filter(business => business.categories.includes(selectedCategory))
        : businesses;

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <Box sx={{ maxWidth: '1280px', mx: 'auto', px: 2 }}>
                {/* Hero Section */}
                <motion.div variants={itemVariants}>
                    <Box sx={{ textAlign: 'center', my: { xs: 4, md: 8 } }}>
                        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            Encuentra y reserva
                        </Typography>
                        <Typography variant="h5" color="text.secondary" sx={{ maxWidth: '700px', mx: 'auto' }}>
                            Desde un corte de cabello hasta una cena especial, todo en un solo lugar.
                        </Typography>
                    </Box>
                </motion.div>

                {/* Search Bar */}
                <motion.div variants={itemVariants}>
                    <Paper elevation={3} sx={{ p: 1, display: 'flex', alignItems: 'center', maxWidth: '800px', mx: 'auto', borderRadius: '50px', mb: { xs: 6, md: 10 }, bgcolor: 'background.paper', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                        <TextField fullWidth variant="standard" placeholder="Restaurante, hotel, barbería..." InputProps={{ disableUnderline: true, startAdornment: (<InputAdornment position="start" sx={{ pl: 2 }}><SearchIcon color="action" /></InputAdornment>), }} />
                        <TextField fullWidth variant="standard" placeholder="¿Dónde?" InputProps={{ disableUnderline: true, startAdornment: (<InputAdornment position="start" sx={{ pl: 2 }}><LocationOnIcon color="action" /></InputAdornment>), }} sx={{ borderLeft: { sm: '1px solid #ddd' }, pl: { sm: 2 } }} />
                        <Button variant="contained" size="large" sx={{ px: 4, py: 1.5 }}>Buscar</Button>
                    </Paper>
                </motion.div>

                {/* Categories Section */}
                <motion.div variants={itemVariants}>
                    <Box sx={{ mb: 8 }}>
                        <Typography variant="h4" component="h2" gutterBottom color="text.primary" sx={{ fontWeight: '600', mb: 3 }}>
                            Explorar por categoría
                        </Typography>
                        {/* FIX: Replaced Grid with a responsive Box using Flexbox */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1.5 }}>
                            {categories.map((cat) => (
                                <Box sx={{ p: 1.5, boxSizing: 'border-box', width: { xs: '50%', sm: '33.33%', md: '25%', lg: '20%' } }} key={cat.id || cat._id}>
                                    <CategoryCard
                                        category={cat}
                                        isSelected={selectedCategory === cat.name}
                                        onClick={() => handleSelectCategory(cat.name)}
                                    />
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </motion.div>

                {/* Listings Section */}
                <motion.div variants={itemVariants}>
                    <Box sx={{ mb: 8 }}>
                        <Typography variant="h4" component="h2" gutterBottom color="text.primary" sx={{ fontWeight: '600', mb: 3 }}>
                            {selectedCategory ? `Resultados para "${selectedCategory}"` : 'Negocios Destacados'}
                        </Typography>
                        {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
                        {error && <Typography color="error" textAlign="center">{error}</Typography>}
                        {!isLoading && filteredBusinesses.length === 0 && (
                            <Box sx={{ textAlign: 'center', p: 4 }}>
                                <Typography>No se encontraron negocios en esta categoría.</Typography>
                                {selectedCategory && (
                                    <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setSelectedCategory(null)}>
                                        Mostrar todos
                                    </Button>
                                )}
                            </Box>
                        )}
                        {/* FIX: Replaced Grid with a responsive Box using Flexbox */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1.5 }}>
                            <AnimatePresence>
                                {filteredBusinesses.map((business) => (
                                    <Box sx={{ p: 1.5, boxSizing: 'border-box', width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' } }} key={business.id}>
                                        <ListingCard
                                            business={business}
                                            onViewDetails={() => navigateTo('businessDetails', business.id)}
                                        />
                                    </Box>
                                ))}
                            </AnimatePresence>
                        </Box>
                    </Box>
                </motion.div>
            </Box>
        </motion.div>
    );
};