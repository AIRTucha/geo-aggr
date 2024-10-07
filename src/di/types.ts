export default {
    ProcessingCore: Symbol.for('ProcessingCore'),
    InjectionCore: Symbol.for('InjectionCore'),
    DataInjection: Symbol.for('DataInjection'),
    DataEmitter: Symbol.for('DataEmitter'),
    SampleStorage: Symbol.for('SampleStorage'),
    EvaluationStorage: Symbol.for('EvaluationStorage'),
    SourceStorage: Symbol.for('SourceStorage'),
    DBDataProvider: Symbol.for('DBDataProvider'),
    DBLink: Symbol.for('DBLink')
} as const
