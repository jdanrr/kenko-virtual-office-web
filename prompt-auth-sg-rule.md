# Prompt para el equipo/módulo de Auth: regla del SG de VPC endpoints

Copia y pega el siguiente prompt al agente o compañero responsable del
microservicio e infraestructura de **auth** (dueños del Terraform que
gestiona el security group compartido de los VPC endpoints).

---

## Prompt

Contexto: los microservicios son independientes, pero comparten la red AWS.
El security group de los VPC endpoints (el que empieza por `sg-02d7fd…`,
confirma el ID completo en la consola) lo gestiona tu código Terraform, y
cualquier regla creada a mano por consola se borra en tu próximo `apply`
(ya pasó con nuestra regla del puerto 8080).

Necesito que agregues en tu código Terraform, en el `endpoints-sg`, una
regla de entrada permanente con estos valores exactos:

- **Puerto/protocolo:** TCP 443 (HTTPS).
- **Origen:** el security group `sg-04461420cbf40aec7`
  (`kenko-dev-profile-ecs-sg`, del microservicio Profile).
- **Propósito (ponlo en la descripción de la regla):** permitir que las
  tareas ECS de Profile alcancen los servicios AWS vía VPC endpoints; sin
  esta regla ninguna tarea nueva de Profile arranca (bloqueo verificado hoy).

Criterios de aceptación:

1. `terraform plan` muestra la regla y `terraform apply` la deja creada.
2. Un `apply` posterior NO la elimina (queda en código, no a mano).
3. Las tareas ECS de Profile (`kenko-dev-profile-ecs-sg`) arrancan sin el
   bloqueo de red de hoy.

Si el ID completo del `endpoints-sg` no es el que empieza por `sg-02d7fd…`,
dime cuál es antes de aplicar. Gracias.
