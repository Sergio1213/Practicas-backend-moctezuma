-- Trigger para actualizar créditos totales del curso cuando se modifica una materia
CREATE OR REPLACE FUNCTION actualizar_creditos_curso_desde_materia()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "Curso" c
  SET "totalCreditos" = (
    SELECT COALESCE(SUM(m."creditos"), 0)
    FROM "CursoMateria" cm
    JOIN "Materia" m ON cm."materiaId" = m."id"
    WHERE cm."cursoId" = c."id"
  )
  FROM "CursoMateria" cm
  WHERE cm."materiaId" = NEW."id" AND cm."cursoId" = c."id";
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_actualizar_creditos_materia
AFTER INSERT OR UPDATE OF creditos ON "Materia"
FOR EACH ROW
EXECUTE FUNCTION actualizar_creditos_curso_desde_materia();

-- Trigger para actualizar créditos cuando se modifica la relación CursoMateria
CREATE OR REPLACE FUNCTION actualizar_creditos_curso()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE "Curso"
    SET "totalCreditos" = (
      SELECT COALESCE(SUM(m."creditos"), 0)
      FROM "CursoMateria" cm
      JOIN "Materia" m ON cm."materiaId" = m."id"
      WHERE cm."cursoId" = OLD."cursoId"
    )
    WHERE "id" = OLD."cursoId";
    RETURN OLD;
  ELSE
    UPDATE "Curso"
    SET "totalCreditos" = (
      SELECT COALESCE(SUM(m."creditos"), 0)
      FROM "CursoMateria" cm
      JOIN "Materia" m ON cm."materiaId" = m."id"
      WHERE cm."cursoId" = NEW."cursoId"
    )
    WHERE "id" = NEW."cursoId";
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_curso_materia_creditos
AFTER INSERT OR UPDATE OR DELETE ON "CursoMateria"
FOR EACH ROW
EXECUTE FUNCTION actualizar_creditos_curso();


-- Función para verificar el estado del sistema antes de modificar calificaciones
CREATE OR REPLACE FUNCTION verificar_estado_sistema()
RETURNS TRIGGER AS $$
DECLARE
  sistema_estado "EstadoSistema";
BEGIN
  SELECT estado INTO sistema_estado FROM "SystemState" WHERE id = 1;
  
  IF sistema_estado != 'ACTIVO' THEN
    RAISE EXCEPTION 'El sistema no está activo para modificaciones de calificaciones';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_verificar_sistema
BEFORE UPDATE OF calificacion ON "GrupoAlumno"
FOR EACH ROW
EXECUTE FUNCTION verificar_estado_sistema();


CREATE OR REPLACE FUNCTION crear_progreso_materias()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar progreso de todas las materias del curso al que pertenece el alumno
  INSERT INTO "ProgresoMateria" ("alumnoId", "materiaId", status, "cuatrimestre", "createdAt", "updatedAt")
  SELECT 
    NEW.id,               -- ID del alumno recién registrado
    cm."materiaId",       -- ID de la materia asociada al curso
    'SIN_CURSAR',         -- Estado inicial
    cm."cuatrimestre",    -- Cuatrimestre tomado del modelo CursoMateria
    NOW(),
    NOW()
  FROM "CursoMateria" cm
  WHERE cm."cursoId" = NEW."cursoId"; -- Relación curso-alumno

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alumno_crear_progreso_materias
AFTER INSERT ON "Alumno"
FOR EACH ROW
EXECUTE FUNCTION crear_progreso_materias();
