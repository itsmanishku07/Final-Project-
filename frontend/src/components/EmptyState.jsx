import { Link } from 'react-router-dom'

/**
 * Reusable Empty State Component
 */
function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  actionLink, 
  onAction 
}) {
  return (
    <div className="text-center py-12 px-4">
      {Icon && (
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {actionText && (actionLink || onAction) && (
        actionLink ? (
          <Link
            to={actionLink}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {actionText}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {actionText}
          </button>
        )
      )}
    </div>
  )
}

export default EmptyState
