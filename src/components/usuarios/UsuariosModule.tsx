/**
 * Módulo de Gestión de Usuarios
 * Condominio Laguna Norte - Sistema de Gestión v2
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSession } from '@/hooks/use-session';
import {
  Users,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Key,
  Shield,
  UserCog,
  User as UserIcon,
  Search,
  Loader2,
  Lock,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import { useExport, ColumnConfig, FilterField } from '@/hooks/use-export';
import FileUpload from '@/components/shared/FileUpload';
import * as XLSX from 'xlsx';

// Definición de categorías de permisos
const CATEGORIAS_PERMISOS = {
  usuarios: {
    label: 'Usuarios',
    permisos: [
      { id: 'usuarios.ver', label: 'Ver' },
      { id: 'usuarios.crear', label: 'Crear' },
      { id: 'usuarios.editar', label: 'Editar' },
      { id: 'usuarios.eliminar', label: 'Eliminar' },
    ],
  },
  residentes: {
    label: 'Residentes',
    permisos: [
      { id: 'residentes.ver', label: 'Ver' },
      { id: 'residentes.crear', label: 'Crear' },
      { id: 'residentes.editar', label: 'Editar' },
      { id: 'residentes.eliminar', label: 'Eliminar' },
    ],
  },
  propiedades: {
    label: 'Propiedades',
    permisos: [
      { id: 'propiedades.ver', label: 'Ver' },
      { id: 'propiedades.crear', label: 'Crear' },
      { id: 'propiedades.editar', label: 'Editar' },
      { id: 'propiedades.eliminar', label: 'Eliminar' },
    ],
  },
  personal: {
    label: 'Personal',
    permisos: [
      { id: 'personal.ver', label: 'Ver' },
      { id: 'personal.crear', label: 'Crear' },
      { id: 'personal.editar', label: 'Editar' },
      { id: 'personal.eliminar', label: 'Eliminar' },
    ],
  },
  proveedores: {
    label: 'Proveedores',
    permisos: [
      { id: 'proveedores.ver', label: 'Ver' },
      { id: 'proveedores.crear', label: 'Crear' },
      { id: 'proveedores.editar', label: 'Editar' },
      { id: 'proveedores.eliminar', label: 'Eliminar' },
    ],
  },
  ordenes_trabajo: {
    label: 'Órdenes de Trabajo',
    permisos: [
      { id: 'ots.ver', label: 'Ver' },
      { id: 'ots.crear', label: 'Crear' },
      { id: 'ots.editar', label: 'Editar' },
      { id: 'ots.eliminar', label: 'Eliminar' },
      { id: 'ots.aprobar', label: 'Aprobar' },
    ],
  },
  proyectos: {
    label: 'Proyectos',
    permisos: [
      { id: 'proyectos.ver', label: 'Ver' },
      { id: 'proyectos.crear', label: 'Crear' },
      { id: 'proyectos.editar', label: 'Editar' },
      { id: 'proyectos.eliminar', label: 'Eliminar' },
    ],
  },
  gastos: {
    label: 'Gastos',
    permisos: [
      { id: 'gastos.ver', label: 'Ver' },
      { id: 'gastos.crear', label: 'Crear' },
      { id: 'gastos.editar', label: 'Editar' },
      { id: 'gastos.eliminar', label: 'Eliminar' },
      { id: 'gastos.aprobar', label: 'Aprobar' },
    ],
  },
  inspecciones: {
    label: 'Inspecciones',
    permisos: [
      { id: 'inspecciones.ver', label: 'Ver' },
      { id: 'inspecciones.crear', label: 'Crear' },
      { id: 'inspecciones.editar', label: 'Editar' },
      { id: 'inspecciones.eliminar', label: 'Eliminar' },
    ],
  },
  activos: {
    label: 'Activos',
    permisos: [
      { id: 'activos.ver', label: 'Ver' },
      { id: 'activos.crear', label: 'Crear' },
      { id: 'activos.editar', label: 'Editar' },
      { id: 'activos.eliminar', label: 'Eliminar' },
    ],
  },
  catalogos: {
    label: 'Catálogos',
    permisos: [
      { id: 'catalogos.ver', label: 'Ver' },
      { id: 'catalogos.crear', label: 'Crear' },
      { id: 'catalogos.editar', label: 'Editar' },
      { id: 'catalogos.eliminar', label: 'Eliminar' },
    ],
  },
  centros_costo: {
    label: 'Centros de Costo',
    permisos: [
      { id: 'centros-costo.ver', label: 'Ver' },
      { id: 'centros-costo.crear', label: 'Crear' },
      { id: 'centros-costo.editar', label: 'Editar' },
      { id: 'centros-costo.eliminar', label: 'Eliminar' },
    ],
  },
  reportes: {
    label: 'Reportes',
    permisos: [
      { id: 'reportes.ver', label: 'Ver' },
      { id: 'reportes.exportar', label: 'Exportar' },
    ],
  },
  configuracion: {
    label: 'Configuración',
    permisos: [
      { id: 'configuracion.ver', label: 'Ver' },
      { id: 'configuracion.editar', label: 'Editar' },
    ],
  },
  logs: {
    label: 'Logs',
    permisos: [
      { id: 'logs.ver', label: 'Ver' },
    ],
  },
  inventario: {
    label: 'Inventario',
    permisos: [
      { id: 'inventario.ver', label: 'Ver' },
      { id: 'inventario.editar', label: 'Editar' },
    ],
  },
  reservas: {
    label: 'Reservas',
    permisos: [
      { id: 'reservas.ver', label: 'Ver' },
      { id: 'reservas.crear', label: 'Crear' },
      { id: 'reservas.editar', label: 'Editar' },
      { id: 'reservas.eliminar', label: 'Eliminar' },
    ],
  },
  cumplimiento: {
    label: 'Cumplimiento Legal',
    permisos: [
      { id: 'cumplimiento.ver', label: 'Ver' },
      { id: 'cumplimiento.editar', label: 'Editar' },
    ],
  },
  auditoria: {
    label: 'Auditoría',
    permisos: [
      { id: 'auditoria.ver', label: 'Ver' },
    ],
  },
  rondas: {
    label: 'Rondas',
    permisos: [
      { id: 'rondas.ver', label: 'Ver' },
      { id: 'rondas.crear', label: 'Crear' },
      { id: 'rondas.editar', label: 'Editar' },
    ],
  },
};

// Tipo para los permisos
type PermisosType = Record<string, boolean>;

// Función para obtener permisos por defecto
const getDefaultPermisos = (): PermisosType => {
  const permisos: PermisosType = {};
  Object.values(CATEGORIAS_PERMISOS).forEach(categoria => {
    categoria.permisos.forEach(permiso => {
      permisos[permiso.id] = false;
    });
  });
  return permisos;
};

// Permisos por defecto según rol
const PERMISOS_DEFAULT_ROL: Record<string, string[]> = {
  admin: Object.values(CATEGORIAS_PERMISOS).flatMap(c => c.permisos.map(p => p.id)),
  supervisor: [
    'usuarios.ver',
    'residentes.ver', 'residentes.crear', 'residentes.editar',
    'propiedades.ver', 'propiedades.editar',
    'personal.ver', 'personal.editar',
    'proveedores.ver', 'proveedores.editar',
    'ots.ver', 'ots.crear', 'ots.editar', 'ots.aprobar',
    'proyectos.ver', 'proyectos.editar',
    'gastos.ver', 'gastos.crear', 'gastos.editar',
    'inspecciones.ver', 'inspecciones.crear', 'inspecciones.editar',
    'activos.ver', 'activos.editar',
    'catalogos.ver', 'catalogos.editar',
    'centros-costo.ver',
    'reportes.ver', 'reportes.exportar',
    'inventario.ver', 'inventario.editar',
    'reservas.ver', 'reservas.crear', 'reservas.editar',
    'cumplimiento.ver',
    'auditoria.ver',
    'rondas.ver', 'rondas.crear',
  ],
  usuario: [
    'residentes.ver',
    'propiedades.ver',
    'ots.ver', 'ots.crear',
    'inspecciones.ver',
    'activos.ver',
    'catalogos.ver',
    'reportes.ver',
    'inventario.ver',
    'reservas.ver',
  ],
  personal: [
    'ots.ver',
    'rondas.ver',
  ],
};

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido?: string | null;
  rut?: string | null;
  rol: string;
  activo: boolean;
  permisos?: string | null;
  ultimoAcceso?: string | null;
  createdAt: string;
}

export function UsuariosModule() {
  const { user: currentUser, isAdmin, hasPermission } = useSession();
  const { currentCondominio } = useAppStore();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'password'>('create');
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [saving, setSaving] = useState(false);

  // Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const exportColumns: ColumnConfig[] = useMemo(() => [
    { key: 'nombre', label: 'Nombre', defaultVisible: true },
    { key: 'apellido', label: 'Apellido', defaultVisible: true },
    { key: 'email', label: 'Email', defaultVisible: true },
    { key: 'rut', label: 'RUT', defaultVisible: true },
    { key: 'rol', label: 'Rol', defaultVisible: true },
    { key: 'activo', label: 'Activo', defaultVisible: true },
    { key: 'ultimoAcceso', label: 'Último Acceso', defaultVisible: true },
    { key: 'createdAt', label: 'Fecha Creación', defaultVisible: true },
  ], []);

  const exportFilters: FilterField[] = useMemo(() => [
    { key: 'rol', label: 'Rol', type: 'select', options: ['admin', 'supervisor', 'usuario', 'personal'] },
    { key: 'activo', label: 'Activo', type: 'boolean' },
  ], []);

  const { ExportButton } = useExport({
    moduleName: 'usuarios',
    moduleLabel: 'Usuarios',
    columns: exportColumns,
    filters: exportFilters,
    getData: () => usuarios,
  });

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    rut: '',
    rol: 'usuario',
    activo: true,
    password: '',
    confirmPassword: '',
    permisos: getDefaultPermisos(),
  });

  useEffect(() => {
    fetchUsuarios();
  }, [currentCondominio]);

  const fetchUsuarios = async () => {
    if (!currentCondominio?.id) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/usuarios?condominioId=${currentCondominio.id}`);
      if (response.ok) {
        const data = await response.json();
        setUsuarios(data);
      } else {
        toast.error('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Parsear permisos desde JSON string
  const parsePermisos = (permisosStr: string | null | undefined): PermisosType => {
    const defaultPermisos = getDefaultPermisos();
    if (!permisosStr) return defaultPermisos;
    
    try {
      const parsed = JSON.parse(permisosStr);
      if (Array.isArray(parsed)) {
        // Si es un array, convertir a objeto
        const permisosObj: PermisosType = { ...defaultPermisos };
        parsed.forEach(p => {
          if (permisosObj.hasOwnProperty(p)) {
            permisosObj[p] = true;
          }
        });
        return permisosObj;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Si ya es un objeto, fusionar con los por defecto
        return { ...defaultPermisos, ...parsed };
      }
    } catch (e) {
      console.error('Error al parsear permisos:', e);
    }
    return defaultPermisos;
  };

  const handleOpenDialog = (mode: 'create' | 'edit' | 'password', user?: Usuario) => {
    setDialogMode(mode);
    setSelectedUser(user || null);

    if (mode === 'create') {
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        rut: '',
        rol: 'usuario',
        activo: true,
        password: '',
        confirmPassword: '',
        permisos: parsePermisos(JSON.stringify(PERMISOS_DEFAULT_ROL.usuario)),
      });
    } else if (user) {
      setFormData({
        nombre: user.nombre,
        apellido: user.apellido || '',
        email: user.email,
        rut: user.rut || '',
        rol: user.rol,
        activo: user.activo,
        password: '',
        confirmPassword: '',
        permisos: parsePermisos(user.permisos),
      });
    }
    setDialogOpen(true);
  };

  const handleRolChange = (rol: string) => {
    const permisosRol = PERMISOS_DEFAULT_ROL[rol] || [];
    const nuevosPermisos = getDefaultPermisos();
    permisosRol.forEach(p => {
      if (nuevosPermisos.hasOwnProperty(p)) {
        nuevosPermisos[p] = true;
      }
    });
    setFormData(prev => ({ ...prev, rol, permisos: nuevosPermisos }));
  };

  const handlePermisoChange = (permisoId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permisos: {
        ...prev.permisos,
        [permisoId]: checked,
      },
    }));
  };

  const handleSave = async () => {
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para guardar el usuario.');
      return;
    }
    setSaving(true);
    try {
      if (dialogMode === 'edit' && selectedUser) {
        const permisosArray = Object.entries(formData.permisos)
          .filter(([, value]) => value)
          .map(([key]) => key);

        const response = await fetch(`/api/usuarios/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            permisos: JSON.stringify(permisosArray),
            condominioId: currentCondominio.id,
          }),
        });
        if (response.ok) {
          toast.success('Usuario actualizado');
          fetchUsuarios();
          setDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.message || 'Error al actualizar');
        }
      } else if (dialogMode === 'create') {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Las contraseñas no coinciden');
          return;
        }
        const permisosArray = Object.entries(formData.permisos)
          .filter(([, value]) => value)
          .map(([key]) => key);

        const response = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            permisos: JSON.stringify(permisosArray),
            condominioId: currentCondominio.id,
          }),
        });
        if (response.ok) {
          toast.success('Usuario creado');
          fetchUsuarios();
          setDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.message || 'Error al crear usuario');
        }
      } else if (dialogMode === 'password' && selectedUser) {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Las contraseñas no coinciden');
          return;
        }
        const response = await fetch(`/api/usuarios/${selectedUser.id}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: formData.password }),
        });
        if (response.ok) {
          toast.success('Contraseña actualizada');
          setDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.message || 'Error al cambiar contraseña');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;

    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast.success('Usuario eliminado');
        fetchUsuarios();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión');
    }
  };

  const handleImportFileChange = (file: File | null) => {
    setImportFile(file);
  };

  const handleMassImport = async () => {
    if (!importFile) {
      toast.error('Por favor, selecciona un archivo para importar.');
      return;
    }
    if (!currentCondominio?.id) {
      toast.error('Debe seleccionar un condominio para importar usuarios.');
      return;
    }

    setImportLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        const transformedData = json.map(item => ({
          nombre: item.Nombre || '',
          apellido: item.Apellido || null,
          email: item.Email || '',
          rut: item.RUT || null,
          rol: item.Rol || 'usuario',
          activo: item.Activo === 'TRUE' || item.Activo === true,
          password: item.Password || '123456', // Default password
          condominioId: currentCondominio.id,
        }));

        const res = await fetch('/api/usuarios/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transformedData),
        });

        if (!res.ok) throw new Error(await res.text());

        toast.success('Usuarios importados con éxito.');
        setImportDialogOpen(false);
        setImportFile(null);
        fetchUsuarios();
      };
      reader.readAsArrayBuffer(importFile);
    } catch (error) {
      console.error('Error during mass import:', error);
      toast.error('Error al importar usuarios. Verifica el formato del archivo.');
    } finally {
      setImportLoading(false);
    }
  };

  const filteredUsuarios = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.rut && u.rut.includes(searchTerm))
  );

  const canEditUser = (user: Usuario) => {
    if (!currentUser) return false;
    if (currentUser.rol === 'admin') return true;
    if (currentUser.rol === 'supervisor' && user.rol !== 'admin') return true;
    return false;
  };

  const canDeleteUser = (user: Usuario) => {
    if (!currentUser) return false;
    if (currentUser.id === user.id) return false; // No se puede eliminar a sí mismo
    if (currentUser.rol === 'admin') return true;
    if (currentUser.rol === 'supervisor' && user.rol !== 'admin') return true;
    return false;
  };

  if (!currentCondominio) {
    return (
      <div className="p-8 text-center text-slate-500">
        Por favor, selecciona un condominio para gestionar los usuarios.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            <h1 className="text-xl font-semibold">Gestión de Usuarios</h1>
          </div>
          <div className="flex gap-2">
            <ExportButton />
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-1" /> Importar
            </Button>
            {hasPermission('usuarios.crear') && (
              <Button onClick={() => handleOpenDialog('create')}>
                <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, email o RUT..." 
                className="pl-8" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No se encontraron usuarios.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{user.nombre.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.nombre} {user.apellido}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.rut || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={user.rol === 'admin' ? 'destructive' : 'secondary'}>{user.rol}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.activo ? 'default' : 'outline'} className={user.activo ? 'bg-green-500' : ''}>
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.ultimoAcceso ? new Date(user.ultimoAcceso).toLocaleString() : 'Nunca'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEditUser(user) && (
                              <DropdownMenuItem onClick={() => handleOpenDialog('edit', user)}>
                                <UserCog className="mr-2 h-4 w-4" /> Editar Usuario y Permisos
                              </DropdownMenuItem>
                            )}
                            {canEditUser(user) && (
                              <DropdownMenuItem onClick={() => handleOpenDialog('password', user)}>
                                <Key className="mr-2 h-4 w-4" /> Cambiar Contraseña
                              </DropdownMenuItem>
                            )}
                            {canDeleteUser(user) && (
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(user.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar Usuario
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' && 'Crear Nuevo Usuario'}
              {dialogMode === 'edit' && 'Editar Usuario'}
              {dialogMode === 'password' && 'Cambiar Contraseña'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode !== 'password' && 'Completa los detalles del usuario y asigna sus permisos.'}
              {dialogMode === 'password' && `Estás cambiando la contraseña para ${selectedUser?.email}.`}
            </DialogDescription>
          </DialogHeader>

          {dialogMode !== 'password' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
              {/* Columna de Datos del Usuario */}
              <div className="md:col-span-1 space-y-4">
                <h3 className="font-semibold text-lg flex items-center"><UserIcon className="mr-2 h-5 w-5" /> Datos del Usuario</h3>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input id="apellido" value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rut">RUT</Label>
                  <Input id="rut" value={formData.rut} onChange={e => setFormData({...formData, rut: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rol">Rol</Label>
                  <Select value={formData.rol} onValueChange={handleRolChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="usuario">Usuario</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox id="activo" checked={formData.activo} onCheckedChange={checked => setFormData({...formData, activo: !!checked})} />
                  <Label htmlFor="activo">Usuario Activo</Label>
                </div>
                {dialogMode === 'create' && (
                  <div className="space-y-4 pt-4 border-t">
                     <h3 className="font-semibold text-lg flex items-center"><Lock className="mr-2 h-5 w-5" /> Contraseña</h3>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <Input id="password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                      <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                    </div>
                  </div>
                )}
              </div>

              {/* Columna de Permisos */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="font-semibold text-lg flex items-center"><Shield className="mr-2 h-5 w-5" /> Permisos</h3>
                <ScrollArea className="h-[450px] border rounded-md p-4">
                  <div className="space-y-4">
                    {Object.entries(CATEGORIAS_PERMISOS).map(([key, categoria]) => (
                      <div key={key}>
                        <h4 className="font-medium mb-2">{categoria.label}</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {categoria.permisos.map(permiso => (
                            <div key={permiso.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={permiso.id} 
                                checked={formData.permisos[permiso.id] || false}
                                onCheckedChange={checked => handlePermisoChange(permiso.id, !!checked)}
                              />
                              <Label htmlFor={permiso.id} className="text-sm font-normal">{permiso.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <Input id="password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {dialogMode === 'password' ? 'Guardar Contraseña' : 'Guardar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogo de Importación Masiva */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Usuarios Masivamente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-slate-500">Sube un archivo Excel (.xlsx) o CSV con los datos de los usuarios. Asegúrate de que las columnas coincidan con los campos (Nombre, Apellido, Email, RUT, Rol, Activo, Password).</p>
            <FileUpload
              label="Archivo de Usuarios"
              onFileUpload={handleImportFileChange}
              onFileRemove={() => handleImportFileChange(null)}
              currentFiles={importFile ? [importFile.name] : []}
              maxFiles={1}
              accept={{ 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'text/csv': ['.csv'] }}
            />
            {importLoading && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Importando...</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleMassImport} disabled={!importFile || importLoading}>Importar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
