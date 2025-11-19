function EnvList({ envs, onDelete, onSelect, onClone, onExport, viewMode = 'grid', sortBy, sortOrder, onSort }) {
    if (envs.length === 0) {
        return <div className="empty-state">No environments found.</div>
    }

    const getSortIndicator = (field) => {
        if (sortBy !== field) return ' ↕'
        return sortOrder === 'asc' ? ' ↑' : ' ↓'
    }

    if (viewMode === 'table') {
        return (
            <div className="env-table-container">
                <table className="env-table">
                    <thead>
                        <tr>
                            <th onClick={() => onSort('name')} style={{ cursor: 'pointer' }}>
                                Name{getSortIndicator('name')}
                            </th>
                            <th onClick={() => onSort('python_version')} style={{ cursor: 'pointer' }}>
                                Python Version{getSortIndicator('python_version')}
                            </th>
                            <th onClick={() => onSort('size')} style={{ cursor: 'pointer' }}>
                                Size{getSortIndicator('size')}
                            </th>
                            <th onClick={() => onSort('last_modified')} style={{ cursor: 'pointer' }}>
                                Last Updated{getSortIndicator('last_modified')}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {envs.map((env) => (
                            <tr key={env.path} onClick={() => onSelect(env.name)}>
                                <td className="env-name-cell">
                                    <strong>{env.name || 'base'}</strong>
                                    <div className="env-path-small" title={env.path}>{env.path}</div>
                                </td>
                                <td>{env.python_version}</td>
                                <td>{env.size}</td>
                                <td>{env.last_modified}</td>
                                <td className="actions-cell">
                                    <button
                                        className="action-btn small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelect(env.name);
                                        }}
                                        title="Manage Packages"
                                    >
                                        Packages
                                    </button>
                                    <button
                                        className="action-btn small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onExport(env.name);
                                        }}
                                        title="Export to YAML"
                                    >
                                        Export
                                    </button>
                                    <button
                                        className="action-btn small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onClone(env.name);
                                        }}
                                        title="Clone Environment"
                                    >
                                        Clone
                                    </button>
                                    {env.name !== 'base' && (
                                        <button
                                            className="delete-btn small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(env.name);
                                            }}
                                            title="Delete Environment"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <div className="env-grid">
            {envs.map((env) => (
                <div key={env.path} className="env-card" onClick={() => onSelect(env.name)}>
                    <div className="env-info">
                        <h3 className="env-name">{env.name || 'base'}</h3>
                        <p className="env-path" title={env.path}>{env.path}</p>
                        <div className="env-meta">
                            <span className="meta-item">
                                <span className="meta-label">Python</span>
                                <span className="meta-value">{env.python_version}</span>
                            </span>
                            <span className="meta-item">
                                <span className="meta-label">Size</span>
                                <span className="meta-value">{env.size}</span>
                            </span>
                            <span className="meta-item">
                                <span className="meta-label">Updated</span>
                                <span className="meta-value">{env.last_modified}</span>
                            </span>
                        </div>
                    </div>
                    <div className="env-actions">
                        <button
                            className="action-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(env.name);
                            }}
                            title="Manage Packages"
                        >
                            Packages
                        </button>
                        <button
                            className="action-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onExport(env.name);
                            }}
                            title="Export to YAML"
                        >
                            Export
                        </button>
                        <button
                            className="action-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClone(env.name);
                            }}
                            title="Clone Environment"
                        >
                            Clone
                        </button>
                        {env.name !== 'base' && (
                            <button
                                className="delete-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(env.name);
                                }}
                                title="Delete Environment"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default EnvList
