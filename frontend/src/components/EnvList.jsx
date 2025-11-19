function EnvList({ envs, onDelete, onSelect, onClone, onExport }) {
    if (envs.length === 0) {
        return <div className="empty-state">No environments found.</div>
    }

    return (
        <div className="env-grid">
            {envs.map((env) => (
                <div key={env.path} className="env-card" onClick={() => onSelect(env.name)}>
                    <div className="env-info">
                        <h3 className="env-name">{env.name || 'base'}</h3>
                        <p className="env-path" title={env.path}>{env.path}</p>
                        <div className="env-meta">
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
