'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import Navigation from '@/components/Navigation'
import AuthModal from '@/components/AuthModal'
import { getCuratedPriceFromUsd } from '@/lib/curated-itinerary-prices'
import { formatEstimatedBudgetUsd } from '@/lib/trip-pricing'

interface SamplePlace {
  name: string
  category: string
  address: string
  day_number: number
}

interface SampleItinerary {
  id: string
  name: string
  description: string
  duration: string
  image: string
  tags: string[]
  cities: string[]
  places: SamplePlace[]
}

const SAMPLE_ITINERARIES: SampleItinerary[] = [
  {
    id: 'paris-classic',
    name: 'Classic Paris',
    description: 'The essential Paris experience: iconic landmarks, world-class museums, and charming neighborhoods.',
    duration: '4 days',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
    tags: ['Culture', 'Romance', 'Art'],
    cities: ['Paris'],
    places: [
      { name: 'Eiffel Tower', category: 'Landmark', address: 'Champ de Mars, Paris', day_number: 1 },
      { name: 'Louvre Museum', category: 'Museum', address: 'Rue de Rivoli, Paris', day_number: 1 },
      { name: 'Notre-Dame Cathedral', category: 'Historic', address: 'Île de la Cité, Paris', day_number: 2 },
      { name: 'Montmartre', category: 'Neighborhood', address: 'Montmartre, Paris', day_number: 2 },
      { name: 'Sacré-Cœur', category: 'Landmark', address: 'Montmartre, Paris', day_number: 2 },
      { name: 'Musée d\'Orsay', category: 'Museum', address: 'Rue de la Légion d\'Honneur, Paris', day_number: 3 },
      { name: 'Luxembourg Gardens', category: 'Park', address: '6th arrondissement, Paris', day_number: 3 },
      { name: 'Champs-Élysées', category: 'Shopping', address: '8th arrondissement, Paris', day_number: 4 },
      { name: 'Arc de Triomphe', category: 'Landmark', address: 'Place Charles de Gaulle, Paris', day_number: 4 },
    ]
  },
  {
    id: 'tokyo-adventure',
    name: 'Tokyo Explorer',
    description: 'From ancient temples to neon-lit streets, experience the fascinating contrasts of Japan\'s capital.',
    duration: '5 days',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
    tags: ['Culture', 'Food', 'Modern'],
    cities: ['Tokyo'],
    places: [
      { name: 'Senso-ji Temple', category: 'Temple', address: 'Asakusa, Tokyo', day_number: 1 },
      { name: 'Tokyo Skytree', category: 'Landmark', address: 'Sumida, Tokyo', day_number: 1 },
      { name: 'Shibuya Crossing', category: 'Landmark', address: 'Shibuya, Tokyo', day_number: 2 },
      { name: 'Meiji Shrine', category: 'Temple', address: 'Shibuya, Tokyo', day_number: 2 },
      { name: 'Harajuku', category: 'Neighborhood', address: 'Harajuku, Tokyo', day_number: 2 },
      { name: 'Tsukiji Outer Market', category: 'Food', address: 'Tsukiji, Tokyo', day_number: 3 },
      { name: 'Ginza', category: 'Shopping', address: 'Ginza, Tokyo', day_number: 3 },
      { name: 'Akihabara', category: 'Entertainment', address: 'Akihabara, Tokyo', day_number: 4 },
      { name: 'teamLab Borderless', category: 'Museum', address: 'Odaiba, Tokyo', day_number: 4 },
      { name: 'Shinjuku Gyoen', category: 'Park', address: 'Shinjuku, Tokyo', day_number: 5 },
    ]
  },
  {
    id: 'barcelona-sun',
    name: 'Barcelona Highlights',
    description: 'Gaudí masterpieces, Mediterranean beaches, and vibrant Catalan culture.',
    duration: '4 days',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
    tags: ['Architecture', 'Beach', 'Food'],
    cities: ['Barcelona'],
    places: [
      { name: 'Sagrada Família', category: 'Landmark', address: 'Eixample, Barcelona', day_number: 1 },
      { name: 'Park Güell', category: 'Park', address: 'Gràcia, Barcelona', day_number: 1 },
      { name: 'La Rambla', category: 'Street', address: 'Ciutat Vella, Barcelona', day_number: 2 },
      { name: 'La Boqueria Market', category: 'Food', address: 'La Rambla, Barcelona', day_number: 2 },
      { name: 'Gothic Quarter', category: 'Neighborhood', address: 'Ciutat Vella, Barcelona', day_number: 2 },
      { name: 'Casa Batlló', category: 'Architecture', address: 'Passeig de Gràcia, Barcelona', day_number: 3 },
      { name: 'Barceloneta Beach', category: 'Beach', address: 'Barceloneta, Barcelona', day_number: 3 },
      { name: 'Montjuïc', category: 'Park', address: 'Montjuïc, Barcelona', day_number: 4 },
    ]
  },
  {
    id: 'rome-history',
    name: 'Eternal Rome',
    description: 'Walk through millennia of history in the ancient heart of the Roman Empire.',
    duration: '4 days',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
    tags: ['History', 'Food', 'Art'],
    cities: ['Rome'],
    places: [
      { name: 'Colosseum', category: 'Historic', address: 'Piazza del Colosseo, Rome', day_number: 1 },
      { name: 'Roman Forum', category: 'Historic', address: 'Via della Salara Vecchia, Rome', day_number: 1 },
      { name: 'Palatine Hill', category: 'Historic', address: 'Via di San Gregorio, Rome', day_number: 1 },
      { name: 'Vatican Museums', category: 'Museum', address: 'Vatican City', day_number: 2 },
      { name: 'St. Peter\'s Basilica', category: 'Landmark', address: 'Vatican City', day_number: 2 },
      { name: 'Trevi Fountain', category: 'Landmark', address: 'Piazza di Trevi, Rome', day_number: 3 },
      { name: 'Pantheon', category: 'Historic', address: 'Piazza della Rotonda, Rome', day_number: 3 },
      { name: 'Piazza Navona', category: 'Plaza', address: 'Piazza Navona, Rome', day_number: 3 },
      { name: 'Trastevere', category: 'Neighborhood', address: 'Trastevere, Rome', day_number: 4 },
    ]
  },
  {
    id: 'bali-escape',
    name: 'Bali Paradise',
    description: 'Temples, rice terraces, and pristine beaches in the Island of the Gods.',
    duration: '6 days',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
    tags: ['Nature', 'Wellness', 'Beach'],
    cities: ['Ubud', 'Seminyak', 'Uluwatu'],
    places: [
      { name: 'Tegallalang Rice Terraces', category: 'Nature', address: 'Tegallalang, Ubud', day_number: 1 },
      { name: 'Sacred Monkey Forest', category: 'Nature', address: 'Ubud', day_number: 1 },
      { name: 'Ubud Palace', category: 'Historic', address: 'Ubud', day_number: 2 },
      { name: 'Tirta Empul Temple', category: 'Temple', address: 'Tampaksiring', day_number: 2 },
      { name: 'Seminyak Beach', category: 'Beach', address: 'Seminyak', day_number: 3 },
      { name: 'Potato Head Beach Club', category: 'Entertainment', address: 'Seminyak', day_number: 3 },
      { name: 'Tanah Lot Temple', category: 'Temple', address: 'Tabanan', day_number: 4 },
      { name: 'Uluwatu Temple', category: 'Temple', address: 'Uluwatu', day_number: 5 },
      { name: 'Padang Padang Beach', category: 'Beach', address: 'Uluwatu', day_number: 5 },
      { name: 'Nusa Dua', category: 'Beach', address: 'Nusa Dua', day_number: 6 },
    ]
  },
  {
    id: 'nyc-first-timer',
    name: 'New York Essentials',
    description: 'The Big Apple\'s must-sees: iconic landmarks, world-class museums, and incredible food.',
    duration: '5 days',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80',
    tags: ['Culture', 'Food', 'Shopping'],
    cities: ['New York'],
    places: [
      { name: 'Statue of Liberty', category: 'Landmark', address: 'Liberty Island, New York', day_number: 1 },
      { name: 'Ellis Island', category: 'Museum', address: 'Ellis Island, New York', day_number: 1 },
      { name: 'Central Park', category: 'Park', address: 'Manhattan, New York', day_number: 2 },
      { name: 'Metropolitan Museum of Art', category: 'Museum', address: '5th Avenue, New York', day_number: 2 },
      { name: 'Times Square', category: 'Landmark', address: 'Midtown Manhattan', day_number: 3 },
      { name: 'Empire State Building', category: 'Landmark', address: '5th Avenue, New York', day_number: 3 },
      { name: 'Brooklyn Bridge', category: 'Landmark', address: 'Brooklyn Bridge, New York', day_number: 4 },
      { name: 'DUMBO', category: 'Neighborhood', address: 'Brooklyn, New York', day_number: 4 },
      { name: 'High Line', category: 'Park', address: 'Chelsea, New York', day_number: 5 },
      { name: 'Chelsea Market', category: 'Food', address: 'Chelsea, New York', day_number: 5 },
    ]
  },
  {
    id: 'greece-islands',
    name: 'Greek Island Hopping',
    description: 'Sun-soaked islands, ancient ruins, and the bluest waters in the Mediterranean.',
    duration: '7 days',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&q=80',
    tags: ['Beach', 'History', 'Romance'],
    cities: ['Athens', 'Santorini', 'Mykonos'],
    places: [
      { name: 'Acropolis', category: 'Historic', address: 'Athens', day_number: 1 },
      { name: 'Plaka', category: 'Neighborhood', address: 'Athens', day_number: 1 },
      { name: 'Ancient Agora', category: 'Historic', address: 'Athens', day_number: 2 },
      { name: 'Oia', category: 'Town', address: 'Santorini', day_number: 3 },
      { name: 'Fira', category: 'Town', address: 'Santorini', day_number: 3 },
      { name: 'Red Beach', category: 'Beach', address: 'Santorini', day_number: 4 },
      { name: 'Akrotiri', category: 'Historic', address: 'Santorini', day_number: 4 },
      { name: 'Mykonos Town', category: 'Town', address: 'Mykonos', day_number: 5 },
      { name: 'Little Venice', category: 'Neighborhood', address: 'Mykonos', day_number: 5 },
      { name: 'Paradise Beach', category: 'Beach', address: 'Mykonos', day_number: 6 },
      { name: 'Delos Island', category: 'Historic', address: 'Delos', day_number: 7 },
    ]
  },
  {
    id: 'amalfi-coast',
    name: 'Amalfi Coast Dream',
    description: 'Cliffside villages, crystal-clear waters, and the best limoncello in Italy.',
    duration: '4 days',
    image: 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=600&q=80',
    tags: ['Beach', 'Romance', 'Food'],
    cities: ['Positano', 'Amalfi', 'Ravello'],
    places: [
      { name: 'Positano Beach', category: 'Beach', address: 'Positano', day_number: 1 },
      { name: 'Path of the Gods', category: 'Hiking', address: 'Positano to Nocelle', day_number: 1 },
      { name: 'Amalfi Cathedral', category: 'Historic', address: 'Amalfi', day_number: 2 },
      { name: 'Amalfi Town', category: 'Town', address: 'Amalfi', day_number: 2 },
      { name: 'Villa Rufolo', category: 'Garden', address: 'Ravello', day_number: 3 },
      { name: 'Villa Cimbrone', category: 'Garden', address: 'Ravello', day_number: 3 },
      { name: 'Furore Fjord', category: 'Nature', address: 'Furore', day_number: 4 },
      { name: 'Emerald Grotto', category: 'Nature', address: 'Conca dei Marini', day_number: 4 },
    ]
  },
  // Country-focused itineraries
  {
    id: 'japan-grand-tour',
    name: 'Japan Grand Tour',
    description: 'From bustling Tokyo to ancient Kyoto, experience the full spectrum of Japanese culture, cuisine, and natural beauty.',
    duration: '14 days',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
    tags: ['Country', 'Culture', 'Food'],
    cities: ['Tokyo', 'Hakone', 'Kyoto', 'Osaka', 'Hiroshima'],
    places: [
      { name: 'Senso-ji Temple', category: 'Temple', address: 'Asakusa, Tokyo', day_number: 1 },
      { name: 'Shibuya Crossing', category: 'Landmark', address: 'Shibuya, Tokyo', day_number: 1 },
      { name: 'Meiji Shrine', category: 'Temple', address: 'Shibuya, Tokyo', day_number: 2 },
      { name: 'Harajuku', category: 'Neighborhood', address: 'Tokyo', day_number: 2 },
      { name: 'teamLab Borderless', category: 'Museum', address: 'Tokyo', day_number: 3 },
      { name: 'Tsukiji Outer Market', category: 'Food', address: 'Tokyo', day_number: 3 },
      { name: 'Hakone Open-Air Museum', category: 'Museum', address: 'Hakone', day_number: 4 },
      { name: 'Lake Ashi', category: 'Nature', address: 'Hakone', day_number: 4 },
      { name: 'Fushimi Inari Shrine', category: 'Temple', address: 'Kyoto', day_number: 5 },
      { name: 'Gion District', category: 'Neighborhood', address: 'Kyoto', day_number: 5 },
      { name: 'Kinkaku-ji', category: 'Temple', address: 'Kyoto', day_number: 6 },
      { name: 'Arashiyama Bamboo Grove', category: 'Nature', address: 'Kyoto', day_number: 6 },
      { name: 'Nijo Castle', category: 'Historic', address: 'Kyoto', day_number: 7 },
      { name: 'Philosopher\'s Path', category: 'Nature', address: 'Kyoto', day_number: 7 },
      { name: 'Nara Park', category: 'Park', address: 'Nara', day_number: 8 },
      { name: 'Todai-ji Temple', category: 'Temple', address: 'Nara', day_number: 8 },
      { name: 'Dotonbori', category: 'Entertainment', address: 'Osaka', day_number: 9 },
      { name: 'Osaka Castle', category: 'Historic', address: 'Osaka', day_number: 9 },
      { name: 'Kuromon Market', category: 'Food', address: 'Osaka', day_number: 10 },
      { name: 'Shinsekai', category: 'Neighborhood', address: 'Osaka', day_number: 10 },
      { name: 'Hiroshima Peace Memorial', category: 'Historic', address: 'Hiroshima', day_number: 11 },
      { name: 'Itsukushima Shrine', category: 'Temple', address: 'Miyajima', day_number: 12 },
      { name: 'Mount Misen', category: 'Nature', address: 'Miyajima', day_number: 12 },
      { name: 'Himeji Castle', category: 'Historic', address: 'Himeji', day_number: 13 },
      { name: 'Akihabara', category: 'Entertainment', address: 'Tokyo', day_number: 14 },
    ]
  },
  {
    id: 'portugal-complete',
    name: 'Best of Portugal',
    description: 'Explore Portugal from Lisbon\'s vibrant streets to Porto\'s wine cellars and the stunning Algarve coast.',
    duration: '10 days',
    image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80',
    tags: ['Country', 'Beach', 'Food'],
    cities: ['Lisbon', 'Sintra', 'Porto', 'Algarve'],
    places: [
      { name: 'Belém Tower', category: 'Historic', address: 'Lisbon', day_number: 1 },
      { name: 'Jerónimos Monastery', category: 'Historic', address: 'Lisbon', day_number: 1 },
      { name: 'Alfama District', category: 'Neighborhood', address: 'Lisbon', day_number: 2 },
      { name: 'Time Out Market', category: 'Food', address: 'Lisbon', day_number: 2 },
      { name: 'Pena Palace', category: 'Historic', address: 'Sintra', day_number: 3 },
      { name: 'Quinta da Regaleira', category: 'Historic', address: 'Sintra', day_number: 3 },
      { name: 'Cabo da Roca', category: 'Nature', address: 'Sintra', day_number: 4 },
      { name: 'Cascais', category: 'Beach', address: 'Cascais', day_number: 4 },
      { name: 'Livraria Lello', category: 'Landmark', address: 'Porto', day_number: 5 },
      { name: 'Ribeira District', category: 'Neighborhood', address: 'Porto', day_number: 5 },
      { name: 'Dom Luís I Bridge', category: 'Landmark', address: 'Porto', day_number: 6 },
      { name: 'Port Wine Cellars', category: 'Food', address: 'Vila Nova de Gaia', day_number: 6 },
      { name: 'São Bento Station', category: 'Landmark', address: 'Porto', day_number: 7 },
      { name: 'Douro Valley', category: 'Nature', address: 'Douro', day_number: 7 },
      { name: 'Lagos Old Town', category: 'Town', address: 'Lagos', day_number: 8 },
      { name: 'Ponta da Piedade', category: 'Nature', address: 'Lagos', day_number: 8 },
      { name: 'Benagil Cave', category: 'Nature', address: 'Algarve', day_number: 9 },
      { name: 'Praia da Marinha', category: 'Beach', address: 'Algarve', day_number: 9 },
      { name: 'Faro Old Town', category: 'Historic', address: 'Faro', day_number: 10 },
    ]
  },
  {
    id: 'vietnam-journey',
    name: 'Vietnam North to South',
    description: 'Journey through Vietnam from Hanoi\'s ancient streets to the Mekong Delta, with stunning landscapes in between.',
    duration: '14 days',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=80',
    tags: ['Country', 'Culture', 'Adventure'],
    cities: ['Hanoi', 'Ha Long Bay', 'Hoi An', 'Ho Chi Minh City'],
    places: [
      { name: 'Old Quarter', category: 'Neighborhood', address: 'Hanoi', day_number: 1 },
      { name: 'Hoan Kiem Lake', category: 'Nature', address: 'Hanoi', day_number: 1 },
      { name: 'Temple of Literature', category: 'Temple', address: 'Hanoi', day_number: 2 },
      { name: 'Ho Chi Minh Mausoleum', category: 'Historic', address: 'Hanoi', day_number: 2 },
      { name: 'Train Street', category: 'Landmark', address: 'Hanoi', day_number: 3 },
      { name: 'Ha Long Bay Cruise', category: 'Nature', address: 'Ha Long Bay', day_number: 4 },
      { name: 'Sung Sot Cave', category: 'Nature', address: 'Ha Long Bay', day_number: 4 },
      { name: 'Ti Top Island', category: 'Beach', address: 'Ha Long Bay', day_number: 5 },
      { name: 'Ninh Binh', category: 'Nature', address: 'Ninh Binh', day_number: 6 },
      { name: 'Tam Coc', category: 'Nature', address: 'Ninh Binh', day_number: 6 },
      { name: 'Hoi An Ancient Town', category: 'Historic', address: 'Hoi An', day_number: 7 },
      { name: 'Japanese Covered Bridge', category: 'Landmark', address: 'Hoi An', day_number: 7 },
      { name: 'An Bang Beach', category: 'Beach', address: 'Hoi An', day_number: 8 },
      { name: 'Hoi An Night Market', category: 'Market', address: 'Hoi An', day_number: 8 },
      { name: 'My Son Sanctuary', category: 'Historic', address: 'Hoi An', day_number: 9 },
      { name: 'Marble Mountains', category: 'Nature', address: 'Da Nang', day_number: 10 },
      { name: 'War Remnants Museum', category: 'Museum', address: 'Ho Chi Minh City', day_number: 11 },
      { name: 'Ben Thanh Market', category: 'Market', address: 'Ho Chi Minh City', day_number: 11 },
      { name: 'Cu Chi Tunnels', category: 'Historic', address: 'Ho Chi Minh City', day_number: 12 },
      { name: 'Notre-Dame Cathedral', category: 'Historic', address: 'Ho Chi Minh City', day_number: 12 },
      { name: 'Mekong Delta', category: 'Nature', address: 'Mekong Delta', day_number: 13 },
      { name: 'Cai Rang Floating Market', category: 'Market', address: 'Can Tho', day_number: 14 },
    ]
  },
  // Multi-country / Region itineraries
  {
    id: 'balkans-adventure',
    name: 'Balkans Adventure',
    description: 'Discover the hidden gems of the Balkans: Croatia\'s stunning coast, Montenegro\'s dramatic fjords, and Slovenia\'s alpine beauty.',
    duration: '14 days',
    image: 'https://images.unsplash.com/photo-1555990793-da11153b2473?w=600&q=80',
    tags: ['Region', 'Adventure', 'Beach'],
    cities: ['Dubrovnik', 'Split', 'Kotor', 'Ljubljana', 'Lake Bled'],
    places: [
      { name: 'Dubrovnik Old Town', category: 'Historic', address: 'Dubrovnik, Croatia', day_number: 1 },
      { name: 'City Walls Walk', category: 'Landmark', address: 'Dubrovnik, Croatia', day_number: 1 },
      { name: 'Lokrum Island', category: 'Nature', address: 'Dubrovnik, Croatia', day_number: 2 },
      { name: 'Banje Beach', category: 'Beach', address: 'Dubrovnik, Croatia', day_number: 2 },
      { name: 'Kotor Old Town', category: 'Historic', address: 'Kotor, Montenegro', day_number: 3 },
      { name: 'Bay of Kotor', category: 'Nature', address: 'Kotor, Montenegro', day_number: 3 },
      { name: 'Fortress of St. John', category: 'Historic', address: 'Kotor, Montenegro', day_number: 4 },
      { name: 'Perast', category: 'Town', address: 'Montenegro', day_number: 4 },
      { name: 'Budva Old Town', category: 'Historic', address: 'Budva, Montenegro', day_number: 5 },
      { name: 'Sveti Stefan', category: 'Landmark', address: 'Montenegro', day_number: 5 },
      { name: 'Diocletian\'s Palace', category: 'Historic', address: 'Split, Croatia', day_number: 6 },
      { name: 'Riva Promenade', category: 'Landmark', address: 'Split, Croatia', day_number: 6 },
      { name: 'Hvar Island', category: 'Beach', address: 'Hvar, Croatia', day_number: 7 },
      { name: 'Hvar Town', category: 'Town', address: 'Hvar, Croatia', day_number: 8 },
      { name: 'Plitvice Lakes', category: 'Nature', address: 'Plitvice, Croatia', day_number: 9 },
      { name: 'Plitvice Waterfalls', category: 'Nature', address: 'Plitvice, Croatia', day_number: 10 },
      { name: 'Ljubljana Old Town', category: 'Historic', address: 'Ljubljana, Slovenia', day_number: 11 },
      { name: 'Ljubljana Castle', category: 'Historic', address: 'Ljubljana, Slovenia', day_number: 11 },
      { name: 'Triple Bridge', category: 'Landmark', address: 'Ljubljana, Slovenia', day_number: 12 },
      { name: 'Lake Bled', category: 'Nature', address: 'Bled, Slovenia', day_number: 13 },
      { name: 'Bled Island', category: 'Landmark', address: 'Bled, Slovenia', day_number: 13 },
      { name: 'Vintgar Gorge', category: 'Nature', address: 'Bled, Slovenia', day_number: 14 },
    ]
  },
  {
    id: 'southeast-asia',
    name: 'Southeast Asia Explorer',
    description: 'The ultimate Southeast Asia adventure: Thai temples, Vietnamese cuisine, and Cambodia\'s ancient wonders.',
    duration: '14 days',
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80',
    tags: ['Region', 'Culture', 'Adventure'],
    cities: ['Bangkok', 'Chiang Mai', 'Siem Reap', 'Ho Chi Minh City', 'Hanoi'],
    places: [
      { name: 'Grand Palace', category: 'Temple', address: 'Bangkok, Thailand', day_number: 1 },
      { name: 'Wat Pho', category: 'Temple', address: 'Bangkok, Thailand', day_number: 1 },
      { name: 'Chatuchak Market', category: 'Market', address: 'Bangkok, Thailand', day_number: 2 },
      { name: 'Khao San Road', category: 'Entertainment', address: 'Bangkok, Thailand', day_number: 2 },
      { name: 'Wat Phra That Doi Suthep', category: 'Temple', address: 'Chiang Mai, Thailand', day_number: 3 },
      { name: 'Old City', category: 'Historic', address: 'Chiang Mai, Thailand', day_number: 3 },
      { name: 'Night Bazaar', category: 'Market', address: 'Chiang Mai, Thailand', day_number: 4 },
      { name: 'Elephant Nature Park', category: 'Nature', address: 'Chiang Mai, Thailand', day_number: 4 },
      { name: 'Angkor Wat', category: 'Temple', address: 'Siem Reap, Cambodia', day_number: 5 },
      { name: 'Angkor Thom', category: 'Temple', address: 'Siem Reap, Cambodia', day_number: 6 },
      { name: 'Ta Prohm', category: 'Temple', address: 'Siem Reap, Cambodia', day_number: 6 },
      { name: 'Pub Street', category: 'Entertainment', address: 'Siem Reap, Cambodia', day_number: 7 },
      { name: 'Tonle Sap Lake', category: 'Nature', address: 'Siem Reap, Cambodia', day_number: 7 },
      { name: 'Ben Thanh Market', category: 'Market', address: 'Ho Chi Minh City, Vietnam', day_number: 8 },
      { name: 'War Remnants Museum', category: 'Museum', address: 'Ho Chi Minh City, Vietnam', day_number: 8 },
      { name: 'Cu Chi Tunnels', category: 'Historic', address: 'Ho Chi Minh City, Vietnam', day_number: 9 },
      { name: 'Mekong Delta', category: 'Nature', address: 'Vietnam', day_number: 10 },
      { name: 'Hoan Kiem Lake', category: 'Nature', address: 'Hanoi, Vietnam', day_number: 11 },
      { name: 'Old Quarter', category: 'Neighborhood', address: 'Hanoi, Vietnam', day_number: 11 },
      { name: 'Temple of Literature', category: 'Temple', address: 'Hanoi, Vietnam', day_number: 12 },
      { name: 'Ha Long Bay', category: 'Nature', address: 'Ha Long Bay, Vietnam', day_number: 13 },
      { name: 'Ha Long Bay Cruise', category: 'Nature', address: 'Ha Long Bay, Vietnam', day_number: 14 },
    ]
  },
  {
    id: 'scandinavia-road-trip',
    name: 'Scandinavia Road Trip',
    description: 'Epic Nordic adventure through Norway\'s fjords, Sweden\'s design capitals, and Denmark\'s hygge culture.',
    duration: '12 days',
    image: 'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?w=600&q=80',
    tags: ['Region', 'Nature', 'Modern'],
    cities: ['Copenhagen', 'Stockholm', 'Oslo', 'Bergen'],
    places: [
      { name: 'Nyhavn', category: 'Neighborhood', address: 'Copenhagen, Denmark', day_number: 1 },
      { name: 'Tivoli Gardens', category: 'Entertainment', address: 'Copenhagen, Denmark', day_number: 1 },
      { name: 'The Little Mermaid', category: 'Landmark', address: 'Copenhagen, Denmark', day_number: 2 },
      { name: 'Christiania', category: 'Neighborhood', address: 'Copenhagen, Denmark', day_number: 2 },
      { name: 'Gamla Stan', category: 'Historic', address: 'Stockholm, Sweden', day_number: 3 },
      { name: 'Vasa Museum', category: 'Museum', address: 'Stockholm, Sweden', day_number: 3 },
      { name: 'ABBA Museum', category: 'Museum', address: 'Stockholm, Sweden', day_number: 4 },
      { name: 'Djurgården', category: 'Nature', address: 'Stockholm, Sweden', day_number: 4 },
      { name: 'Stockholm Archipelago', category: 'Nature', address: 'Stockholm, Sweden', day_number: 5 },
      { name: 'Oslo Opera House', category: 'Landmark', address: 'Oslo, Norway', day_number: 6 },
      { name: 'Vigeland Park', category: 'Park', address: 'Oslo, Norway', day_number: 6 },
      { name: 'Viking Ship Museum', category: 'Museum', address: 'Oslo, Norway', day_number: 7 },
      { name: 'Munch Museum', category: 'Museum', address: 'Oslo, Norway', day_number: 7 },
      { name: 'Flåm Railway', category: 'Nature', address: 'Flåm, Norway', day_number: 8 },
      { name: 'Nærøyfjord', category: 'Nature', address: 'Norway', day_number: 8 },
      { name: 'Sognefjord', category: 'Nature', address: 'Norway', day_number: 9 },
      { name: 'Bergen Bryggen', category: 'Historic', address: 'Bergen, Norway', day_number: 10 },
      { name: 'Mount Fløyen', category: 'Nature', address: 'Bergen, Norway', day_number: 10 },
      { name: 'Fish Market', category: 'Food', address: 'Bergen, Norway', day_number: 11 },
      { name: 'Hardangerfjord', category: 'Nature', address: 'Norway', day_number: 12 },
    ]
  },
]

export default function DiscoverPage() {
  const { user, session } = useAuth()
  const [copying, setCopying] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null)
  const [viewingItinerary, setViewingItinerary] = useState<SampleItinerary | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const pendingCopyRef = useRef<SampleItinerary | null>(null)

  const TRIP_TYPES = ['City', 'Country', 'Region']
  const allInterests = Array.from(new Set(
    SAMPLE_ITINERARIES.flatMap(i => i.tags.filter(t => !TRIP_TYPES.includes(t)))
  )).sort()
  
  const filteredItineraries = SAMPLE_ITINERARIES.filter(i => {
    const matchesType = !selectedType || i.tags.includes(selectedType) || 
      (selectedType === 'City' && !i.tags.includes('Country') && !i.tags.includes('Region'))
    const matchesInterest = !selectedInterest || i.tags.includes(selectedInterest)
    return matchesType && matchesInterest
  })

  const executeCopyItinerary = useCallback(
    async (itinerary: SampleItinerary) => {
      const token = session?.access_token
      if (!token) return

      setCopying(itinerary.id)
      try {
        const response = await fetch('/api/itineraries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: itinerary.name }),
        })

        if (response.ok) {
          const data = await response.json()
          const newItineraryId = data.itinerary.id

          for (const place of itinerary.places) {
            await fetch('/api/saved-places', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                itinerary_id: newItineraryId,
                place_id: `sample-${place.name.toLowerCase().replace(/\s+/g, '-')}`,
                name: place.name,
                category: place.category,
                address: place.address,
                city: itinerary.cities[0],
                day_number: place.day_number,
              }),
            })
          }

          setCopiedId(itinerary.id)
          setTimeout(() => setCopiedId(null), 3000)
        }
      } catch (error) {
        console.error('Failed to copy itinerary:', error)
      } finally {
        setCopying(null)
      }
    },
    [session?.access_token]
  )

  useEffect(() => {
    if (!user || !session?.access_token) return
    const pending = pendingCopyRef.current
    if (!pending) return
    pendingCopyRef.current = null
    void executeCopyItinerary(pending)
  }, [user, session?.access_token, executeCopyItinerary])

  async function copyToMyTrips(itinerary: SampleItinerary) {
    if (!user || !session?.access_token) {
      pendingCopyRef.current = itinerary
      setShowAuthModal(true)
      return
    }
    await executeCopyItinerary(itinerary)
  }

  return (
    <>
    <main className="min-h-screen bg-cream-100">
      <Navigation />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-serif text-stone-900 mb-3">Discover Itineraries</h1>
          <p className="text-stone-500 max-w-xl mx-auto">
            Get inspired by our curated travel itineraries. Copy any trip to your account and customize it for your adventure.
          </p>
        </div>

        {/* Trip Type filters */}
        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              !selectedType 
                ? 'bg-stone-900 text-white' 
                : 'bg-white border border-cream-300 text-stone-600 hover:border-stone-400'
            }`}
          >
            All Trips
          </button>
          <button
            onClick={() => setSelectedType(selectedType === 'City' ? null : 'City')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'City' 
                ? 'bg-stone-900 text-white' 
                : 'bg-white border border-cream-300 text-stone-600 hover:border-stone-400'
            }`}
          >
            <i className="fa-solid fa-city mr-2"></i>
            City
          </button>
          <button
            onClick={() => setSelectedType(selectedType === 'Country' ? null : 'Country')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'Country' 
                ? 'bg-stone-900 text-white' 
                : 'bg-white border border-cream-300 text-stone-600 hover:border-stone-400'
            }`}
          >
            <i className="fa-solid fa-flag mr-2"></i>
            Country
          </button>
          <button
            onClick={() => setSelectedType(selectedType === 'Region' ? null : 'Region')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              selectedType === 'Region' 
                ? 'bg-stone-900 text-white' 
                : 'bg-white border border-cream-300 text-stone-600 hover:border-stone-400'
            }`}
          >
            <i className="fa-solid fa-globe mr-2"></i>
            Multi-Country
          </button>
        </div>

        {/* Interest filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {allInterests.map(interest => (
            <button
              key={interest}
              onClick={() => setSelectedInterest(interest === selectedInterest ? null : interest)}
              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                selectedInterest === interest 
                  ? 'bg-stone-700 text-white' 
                  : 'bg-cream-200 text-stone-600 hover:bg-cream-300'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>

        {/* Itinerary grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItineraries.map(itinerary => (
            <div 
              key={itinerary.id}
              className="bg-white rounded-xl overflow-hidden border border-cream-300 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setViewingItinerary(itinerary)}
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                <img 
                  src={itinerary.image} 
                  alt={itinerary.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  {itinerary.tags.slice(0, 2).map(tag => (
                    <span 
                      key={tag}
                      className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-stone-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-serif text-xl text-stone-900">{itinerary.name}</h3>
                  <span className="text-xs text-stone-500 bg-cream-100 px-2 py-1 rounded">
                    {itinerary.duration}
                  </span>
                </div>
                
                <p className="text-stone-500 text-sm mb-3 line-clamp-2">
                  {itinerary.description}
                </p>
                
                <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-2">
                  <i className="fa-solid fa-location-dot"></i>
                  <span>{itinerary.cities.join(' → ')}</span>
                  <span className="mx-1">•</span>
                  <span>{itinerary.places.length} places</span>
                </div>
                <p className="text-sm font-medium text-stone-800 mb-1">
                  <i className="fa-solid fa-tag mr-1.5 text-stone-400"></i>
                  From {formatEstimatedBudgetUsd(getCuratedPriceFromUsd(itinerary.id))}
                </p>
                <p className="text-xs text-stone-400 mb-4">Est. trip budget (excl. flights)</p>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToMyTrips(itinerary)
                  }}
                  disabled={copying === itinerary.id || copiedId === itinerary.id}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    copiedId === itinerary.id
                      ? 'bg-green-100 text-green-700'
                      : 'bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50'
                  }`}
                >
                  {copying === itinerary.id ? (
                    <><i className="fa-solid fa-circle-notch animate-spin mr-2"></i>Copying...</>
                  ) : copiedId === itinerary.id ? (
                    <><i className="fa-solid fa-check mr-2"></i>Added to My Trips!</>
                  ) : (
                    <><i className="fa-solid fa-plus mr-2"></i>Copy to My Trips</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Itinerary Detail Modal */}
      {viewingItinerary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setViewingItinerary(null)}
          ></div>
          <div className="relative bg-cream-50 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header Image */}
            <div className="relative h-48 flex-shrink-0">
              <img 
                src={viewingItinerary.image} 
                alt={viewingItinerary.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <button 
                onClick={() => setViewingItinerary(null)} 
                className="absolute top-4 right-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-stone-600 hover:bg-white transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex gap-2 mb-2">
                  {viewingItinerary.tags.map(tag => (
                    <span 
                      key={tag}
                      className="bg-white/90 px-2 py-0.5 rounded text-xs font-medium text-stone-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h2 className="text-3xl font-serif text-white">{viewingItinerary.name}</h2>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Overview */}
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 mb-3">
                  <span className="flex items-center gap-1.5">
                    <i className="fa-regular fa-calendar"></i>
                    {viewingItinerary.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-location-dot"></i>
                    {viewingItinerary.cities.length} {viewingItinerary.cities.length === 1 ? 'city' : 'cities'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-map-pin"></i>
                    {viewingItinerary.places.length} places
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-stone-800">
                    <i className="fa-solid fa-tag text-stone-400"></i>
                    From {formatEstimatedBudgetUsd(getCuratedPriceFromUsd(viewingItinerary.id))}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mb-3">Est. trip budget (excl. flights)</p>
                <p className="text-stone-600">{viewingItinerary.description}</p>
              </div>

              {/* Cities */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">
                  Cities You'll Visit
                </h3>
                <div className="flex flex-wrap gap-2">
                  {viewingItinerary.cities.map((city, idx) => (
                    <span key={city} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-cream-300">
                      <span className="w-5 h-5 bg-stone-900 text-white rounded-full text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-stone-700">{city}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Day by Day */}
              <div>
                <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-3">
                  Day by Day Itinerary
                </h3>
                <div className="space-y-3">
                  {Array.from(new Set(viewingItinerary.places.map(p => p.day_number))).sort((a, b) => a - b).map(day => {
                    const dayPlaces = viewingItinerary.places.filter(p => p.day_number === day)
                    const dayCity = dayPlaces[0]?.address?.split(',').pop()?.trim() || viewingItinerary.cities[0]
                    return (
                      <div key={day} className="bg-white rounded-lg border border-cream-300 overflow-hidden">
                        <div className="bg-cream-100 px-4 py-2 border-b border-cream-200">
                          <span className="font-medium text-stone-700">Day {day}</span>
                          <span className="text-stone-400 text-sm ml-2">• {dayCity}</span>
                        </div>
                        <div className="p-4">
                          <div className="space-y-2">
                            {dayPlaces.map((place, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-cream-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs text-stone-500">{idx + 1}</span>
                                </div>
                                <div>
                                  <p className="text-stone-800 font-medium">{place.name}</p>
                                  <p className="text-xs text-stone-400">{place.category}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-cream-300 bg-white">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  copyToMyTrips(viewingItinerary)
                }}
                disabled={copying === viewingItinerary.id || copiedId === viewingItinerary.id}
                className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
                  copiedId === viewingItinerary.id
                    ? 'bg-green-100 text-green-700'
                    : 'bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50'
                }`}
              >
                {copying === viewingItinerary.id ? (
                  <><i className="fa-solid fa-circle-notch animate-spin mr-2"></i>Copying to My Trips...</>
                ) : copiedId === viewingItinerary.id ? (
                  <><i className="fa-solid fa-check mr-2"></i>Added to My Trips!</>
                ) : (
                  <><i className="fa-solid fa-plus mr-2"></i>Copy to My Trips</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>

    <AuthModal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      onDismiss={() => {
        pendingCopyRef.current = null
      }}
      initialMode="login"
    />
    </>
  )
}
