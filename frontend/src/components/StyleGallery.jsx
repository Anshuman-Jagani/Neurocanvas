import { useState, useEffect } from 'react';

export default function StyleGallery({ onStyleSelect, selectedStyle }) {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStyles();
  }, []);

  const fetchStyles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/style-transfer/styles');
      const data = await response.json();
      setStyles(data.styles || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching styles:', err);
      setError('Failed to load styles');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading styles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        {error}
      </div>
    );
  }

  if (styles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        No styles available. Please add style images to the data/styles directory.
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Art Style
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {styles.map((style) => (
          <div
            key={style.id}
            onClick={() => onStyleSelect(style.id)}
            className={`
              relative cursor-pointer rounded-lg overflow-hidden
              transition-all duration-200 transform hover:scale-105
              ${selectedStyle === style.id 
                ? 'ring-4 ring-blue-500 shadow-lg' 
                : 'ring-1 ring-gray-200 hover:ring-2 hover:ring-blue-300'
              }
            `}
          >
            <img
              src={`http://localhost:5000${style.thumbnail}`}
              alt={style.name}
              className="w-full h-32 object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <p className="text-white text-sm font-medium truncate">
                {style.name}
              </p>
            </div>
            {selectedStyle === style.id && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
