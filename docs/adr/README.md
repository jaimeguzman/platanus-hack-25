# Architecture Decision Records (ADR)

Este directorio contiene las Decisiones de Arquitectura (ADR) para el proyecto Platanus Hack 25.

## ¿Qué es un ADR?

Un Architecture Decision Record (ADR) es un documento que captura una decisión arquitectónica importante tomada junto con su contexto y consecuencias.

## Formato de ADR

Cada ADR sigue el siguiente formato:

1. **Título**: ADR-XXXX: [Título descriptivo]
2. **Estado**: Propuesto | Aceptado | Rechazado | Obsoleto
3. **Contexto**: ¿Cuál es el problema o situación que estamos abordando?
4. **Decisión**: ¿Qué hemos decidido hacer?
5. **Consecuencias**: ¿Cuáles son las implicaciones de esta decisión?

## Índice de ADRs

- [ADR-0001: Usar Architecture Decision Records](./0001-usar-architecture-decision-records.md)

## Cómo crear un nuevo ADR

1. Copiar la plantilla desde `adr-template.md`
2. Nombrar el archivo con el formato: `XXXX-titulo-descriptivo.md`
3. Completar todas las secciones
4. Crear un PR para revisión
5. Actualizar este índice una vez aprobado

## Referencias

- [Documenting Architecture Decisions](http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR Tools](https://github.com/npryce/adr-tools)