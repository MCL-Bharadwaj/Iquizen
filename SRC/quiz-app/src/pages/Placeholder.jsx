const Placeholder = ({ title, isDark }) => {
  return (
    <div className="p-8">
      <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h1>
      <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        This page is under construction.
      </p>
    </div>
  );
};

export default Placeholder;
