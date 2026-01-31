export function SearchHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold mb-2">Find Restaurants</h1>
      <p className="text-gray-600">Discover local restaurants and real-time wait times</p>
      <input
        type="search"
        placeholder="Search by cuisine, location..."
        className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg"
      />
    </div>
  );
}
