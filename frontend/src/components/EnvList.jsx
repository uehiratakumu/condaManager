function EnvList({ envs, onDelete, onSelect, onClone, onExport, viewMode = 'grid' }) {
    if (envs.length === 0) {
        return <div className="empty-state">No environments found.</div>
    }

    if (viewMode === 'table') {
        return (
            <div className="env-table-container">
                <table className="env-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Python Version</th>
                            <th>Size</th>
                            <th>Last Updated</th>
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
                            <span className="meta-item">Python: {env.python_version}</span>
                            <span className="meta-item">Size: {env.size}</span>
                            <span className="meta-item">Updated: {env.last_modified}</span>
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
