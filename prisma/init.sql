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

-- Función para actualizar el progreso del alumno
CREATE OR REPLACE FUNCTION actualizar_progreso_alumno()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."calificacion" IS NOT NULL AND NEW."calificacion" != OLD."calificacion" THEN
    INSERT INTO "ProgresoMateria" ("alumnoId", "materiaId", "completado", "calificacion", "estadoMateria", "fechaFinal")
    VALUES (
      NEW."alumnoId",
      (SELECT "materiaId" FROM "Grupo" WHERE "id" = NEW."grupoId"),
      NEW."calificacion" >= 6,
      NEW."calificacion",
      CASE 
        WHEN NEW."calificacion" >= 6 THEN 'APROBADA'::"EstadoMateria"
        ELSE 'REPROBADA'::"EstadoMateria"
      END,
      CURRENT_TIMESTAMP
    )
    ON CONFLICT ("alumnoId", "materiaId") 
    DO UPDATE SET
      "completado" = EXCLUDED."completado",
      "calificacion" = EXCLUDED."calificacion",
      "estadoMateria" = EXCLUDED."estadoMateria",
      "fechaFinal" = EXCLUDED."fechaFinal",
      "updatedAt" = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_actualizar_progreso
AFTER UPDATE OF calificacion ON "GrupoAlumno"
FOR EACH ROW
EXECUTE FUNCTION actualizar_progreso_alumno();

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
