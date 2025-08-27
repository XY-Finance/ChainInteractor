'use client'

interface UseCase {
  id: string
  title: string
  description: string
  status: 'ready' | 'tba'
}

interface UseCaseCardProps {
  useCase: UseCase
  isSelected: boolean
  onSelect: () => void
  onAction: () => void
}

export default function UseCaseCard({ useCase, isSelected, onSelect, onAction }: UseCaseCardProps) {
  const isReady = useCase.status === 'ready'

  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'border-orange-500 bg-orange-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{useCase.title}</h3>
          <p className="text-sm text-gray-600 mb-3">{useCase.description}</p>

          {isReady && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAction()
              }}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Now
            </button>
          )}

          {!isReady && (
            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              TBA
            </span>
          )}
        </div>

        <div className="ml-4">
          {isReady ? (
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
          ) : (
            <span className="inline-block w-3 h-3 bg-gray-400 rounded-full"></span>
          )}
        </div>
      </div>
    </div>
  )
}
